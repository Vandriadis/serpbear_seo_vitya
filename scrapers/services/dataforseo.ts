interface DataForSEOItem {
   type: string,
   rank_group?: number,
   title?: string,
   url?: string,
}

interface DataForSEOTask {
   id?: string,
   status_code?: number,
   status_message?: string,
   result?: { items?: DataForSEOItem[] }[] | null,
}

interface DataForSEOResponse {
   status_code?: number,
   status_message?: string,
   tasks?: DataForSEOTask[],
}

const LIVE_ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
const TASK_POST_ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/organic/task_post';
const TASK_GET_BASE = 'https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced';

const SUCCESS_STATUS = 20000;
const TASK_CREATED_STATUS = 20100;
const DEFAULT_DEPTH = 10;
const MAX_DEPTH_LIVE = 200;
const MAX_DEPTH_ASYNC = 700;

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

const buildBasicToken = (apiKey: string): string => {
   const key = (apiKey || '').trim();
   if (!key) { return ''; }
   return key.includes(':') ? Buffer.from(key, 'utf-8').toString('base64') : key;
};

const buildAuthHeaders = (settings: SettingsType) => ({
   'Content-Type': 'application/json',
   Authorization: `Basic ${buildBasicToken(settings.scaping_api || '')}`,
});

const buildTask = (
   keyword: KeywordType,
   settings: SettingsType,
   countryData: countryData,
): Record<string, string | number> => {
   const country = keyword.country || 'US';
   const countryInfo = countryData[country] || countryData.US;
   const isMobile = keyword.device === 'mobile';
   const mode = settings.dataforseo_mode || 'async';
   const maxDepth = mode === 'live' ? MAX_DEPTH_LIVE : MAX_DEPTH_ASYNC;
   const depth = Math.min(settings.dataforseo_depth || DEFAULT_DEPTH, maxDepth);

   const task: Record<string, string | number> = {
      keyword: keyword.keyword,
      language_code: countryInfo[2],
      device: isMobile ? 'mobile' : 'desktop',
      os: isMobile ? 'android' : 'windows',
      depth,
   };

   if (keyword.city) {
      task.location_name = `${keyword.city},${countryInfo[0]}`;
   } else {
      task.location_code = countryInfo[3];
   }

   return task;
};

const extractOrganicResults = (tasks: DataForSEOTask[]) => {
   const [task] = Array.isArray(tasks) ? tasks : [];
   if (!task) {
      throw new Error('DataForSEO returned an empty task list.');
   }
   if (task.status_code && task.status_code !== SUCCESS_STATUS) {
      const msg = task.status_message || 'Unknown task error';
      throw new Error(`DataForSEO Error ${task.status_code}: ${msg}`);
   }

   const firstResult = task.result && task.result[0];
   if (firstResult && (firstResult as any).check_url) {
      console.log('[DataForSEO] check_url:', (firstResult as any).check_url);
   }
   const items = (firstResult && firstResult.items) || [];
   const extractedResult = [];
   for (const item of items) {
      if (item.type === 'organic' && item.title && item.url) {
         extractedResult.push({
            title: item.title,
            url: item.url,
            position: item.rank_group || extractedResult.length + 1,
         });
      }
   }
   return extractedResult;
};

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Async flow: POST task → poll Task GET until results are ready.
 * Returns the same format as Live so the caller doesn't need to know the difference.
 */
const fetchAsync = async (
   keyword: KeywordType,
   settings: SettingsType,
   countryData: countryData,
): Promise<KeywordLastResult[]> => {
   const headers = buildAuthHeaders(settings);
   const task = buildTask(keyword, settings, countryData);

   const postRes = await fetch(TASK_POST_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify([task]),
   });
   const postBody: DataForSEOResponse = await postRes.json();

   if (postBody.status_code && postBody.status_code !== SUCCESS_STATUS) {
      throw new Error(`DataForSEO Task POST ${postBody.status_code}: ${postBody.status_message || 'Unknown API error'}`);
   }

   if (!postBody.tasks || !postBody.tasks[0]) {
      throw new Error(`DataForSEO Task POST returned empty tasks. API message: ${postBody.status_message || 'Unknown'}`);
   }
   const postedTask = postBody.tasks[0];
   if (postedTask.status_code !== TASK_CREATED_STATUS) {
      const msg = postedTask.status_message || 'Task creation failed';
      throw new Error(`DataForSEO Task POST ${postedTask.status_code}: ${msg}`);
   }
   const taskId = postedTask.id;
   if (!taskId) {
      throw new Error('DataForSEO Task POST did not return a task id.');
   }

   for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);

      const getRes = await fetch(`${TASK_GET_BASE}/${taskId}`, {
         method: 'GET',
         headers,
      });
      const getBody: DataForSEOResponse = await getRes.json();

      if (getBody.status_code && getBody.status_code >= 50000) {
         throw new Error(`DataForSEO API ${getBody.status_code}: ${getBody.status_message || 'Unknown API error'}`);
      }

      const resultTask = getBody.tasks && getBody.tasks[0];

      if (!resultTask) { continue; }

      if (resultTask.status_code === SUCCESS_STATUS && resultTask.result) {
         return extractOrganicResults([resultTask]);
      }

      // 40602 = Task In Queue, 40603 = Task In Progress — keep polling
      if (resultTask.status_code === 40602 || resultTask.status_code === 40603) {
         console.log(`[DataForSEO] Task ${taskId} still pending (${resultTask.status_code}), attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}`);
         continue;
      }
      if (resultTask.status_code && resultTask.status_code >= 40000) {
         const msg = resultTask.status_message || 'Task failed';
         throw new Error(`DataForSEO Task GET ${resultTask.status_code}: ${msg}`);
      }
   }

   throw new Error('DataForSEO async task timed out after polling.');
};

const dataforseo: ScraperSettings = {
   id: 'dataforseo',
   name: 'DataForSEO',
   website: 'dataforseo.com',
   allowsCity: true,
   nativePagination: true,
   method: 'POST',

   headers: (_keyword, settings) => buildAuthHeaders(settings),

   scrapeURL: (_keyword, settings) => {
      const mode = settings.dataforseo_mode || 'async';
      return mode === 'live' ? LIVE_ENDPOINT : TASK_POST_ENDPOINT;
   },

   payload: (keyword, settings, countryData) => [buildTask(keyword, settings, countryData)],

   resultObjectKey: 'tasks',

   serpExtractor: (content) => {
      const tasks: DataForSEOTask[] = (
         typeof content === 'string'
      ) ? JSON.parse(content) : content as unknown as DataForSEOTask[];
      return extractOrganicResults(tasks);
   },

   /**
    * For async mode the generic scraper pipeline (POST → parse response) is not enough:
    * we need POST → poll → GET. This custom fetcher overrides the default pipeline.
    */
   asyncFetcher: fetchAsync,
};

export default dataforseo;
