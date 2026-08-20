import axios from 'axios';
import Domain from '../database/models/domain';

export type DomainHealthResult = {
   alive: boolean,
   alive_checked_at: string,
   alive_status_code: number | null,
   alive_error: string,
}

const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT = 'SerpBear-DomainHealth/1.0';

/**
 * Sends a GET request to the domain and treats HTTP 200 as alive.
 * Tries https first, then http if the secure request fails to connect.
 */
export const probeDomainAlive = async (domainName: string): Promise<DomainHealthResult> => {
   const checkedAt = new Date().toJSON();
   const urls = [`https://${domainName}`, `http://${domainName}`];
   let lastError = '';
   let lastStatus: number | null = null;

   for (const url of urls) {
      try {
         const response = await axios.get(url, {
            timeout: REQUEST_TIMEOUT_MS,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
               'User-Agent': USER_AGENT,
               Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
         });
         lastStatus = response.status;
         if (response.status === 200) {
            return {
               alive: true,
               alive_checked_at: checkedAt,
               alive_status_code: 200,
               alive_error: '',
            };
         }
         lastError = `HTTP ${response.status}`;
         // Got a response from the host — no need to retry http after https
         break;
      } catch (error: any) {
         lastError = error?.code || error?.message || 'Request failed';
      }
   }

   return {
      alive: false,
      alive_checked_at: checkedAt,
      alive_status_code: lastStatus,
      alive_error: lastError,
   };
};

/**
 * Probes a Domain model row and persists the health fields.
 */
export const checkAndUpdateDomainHealth = async (domainRow: Domain): Promise<DomainType> => {
   const plain = domainRow.get({ plain: true }) as DomainType;
   const result = await probeDomainAlive(plain.domain);
   await domainRow.update(result);
   return { ...plain, ...result };
};

/**
 * Checks one domain by hostname, or all domains when domainName is omitted.
 */
export const checkDomainsHealth = async (domainName?: string): Promise<DomainType[]> => {
   const rows: Domain[] = domainName
      ? await Domain.findAll({ where: { domain: domainName } })
      : await Domain.findAll();

   if (domainName && rows.length === 0) {
      throw new Error('Domain not found');
   }

   const updated: DomainType[] = [];
   for (const row of rows) {
      const result = await checkAndUpdateDomainHealth(row);
      updated.push(result);
   }
   return updated;
};
