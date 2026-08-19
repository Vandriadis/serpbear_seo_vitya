interface DataForSEOItem {
   type: string,
   rank_group?: number,
   title?: string,
   url?: string,
}

interface DataForSEOTask {
   status_code?: number,
   status_message?: string,
   result?: { items?: DataForSEOItem[] }[] | null,
}

const DATAFORSEO_LIVE_ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
const SUCCESS_STATUS = 20000;
const DEFAULT_DEPTH = 10;

/**
 * DataForSEO authenticates with HTTP Basic using the account login (email) and password.
 * The Settings field accepts either `login:password` or an already base64 encoded token.
 */
const buildBasicToken = (apiKey: string): string => {
   const key = (apiKey || '').trim();
   if (!key) { return ''; }
   return key.includes(':') ? Buffer.from(key, 'utf-8').toString('base64') : key;
};

const dataforseo:ScraperSettings = {
   id: 'dataforseo',
   name: 'DataForSEO',
   website: 'dataforseo.com',
   allowsCity: true,
   nativePagination: true,
   method: 'POST',
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Basic ${buildBasicToken(settings.scaping_api || '')}`,
      };
   },
   scrapeURL: () => DATAFORSEO_LIVE_ENDPOINT,
   payload: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const countryInfo = countryData[country] || countryData.US;
      const isMobile = keyword.device === 'mobile';
      const depth = settings.dataforseo_depth || DEFAULT_DEPTH;

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

      return [task];
   },
   resultObjectKey: 'tasks',
   serpExtractor: (content) => {
      const extractedResult = [];
      const tasks: DataForSEOTask[] = (
         typeof content === 'string'
      ) ? JSON.parse(content) : content as unknown as DataForSEOTask[];
      const [task] = Array.isArray(tasks) ? tasks : [];

      if (!task) {
         throw new Error('DataForSEO returned an empty task list.');
      }
      if (task.status_code && task.status_code !== SUCCESS_STATUS) {
         const msg = task.status_message || 'Unknown task error';
         throw new Error(`DataForSEO Error ${task.status_code}: ${msg}`);
      }

      const items = (
         task.result && task.result[0] && task.result[0].items
      ) || [];
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
   },
};

export default dataforseo;
