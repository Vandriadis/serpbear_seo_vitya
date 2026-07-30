import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import getdomainStats from '../../utils/domains';
import verifyUser from '../../utils/verifyUser';
import { checkSerchConsoleIntegration, removeLocalSCData } from '../../utils/searchConsole';
import { removeFromRetryQueue } from '../../utils/scraper';
import parseDomainTags from '../../utils/parseDomainTags';

type DomainsGetRes = {
   domains: DomainType[]
   error?: string|null,
}

type DomainsAddResponse = {
   domains: DomainType[]|null,
   error?: string|null,
}

type DomainsDeleteRes = {
   domainRemoved: number,
   keywordsRemoved: number,
   SCDataRemoved: boolean,
   error?: string|null,
}

type DomainsUpdateRes = {
   domain: DomainType|null,
   error?: string|null,
}

const formatDomain = (el: Domain): DomainType => {
   const domainItem = el.get({ plain: true }) as DomainType & { tags?: string | string[] };
   return {
      ...domainItem,
      tags: parseDomainTags(domainItem.tags),
   };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getDomains(req, res);
   }
   if (req.method === 'POST') {
      return addDomain(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteDomain(req, res);
   }
   if (req.method === 'PUT') {
      return updateDomain(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

export const getDomains = async (req: NextApiRequest, res: NextApiResponse<DomainsGetRes>) => {
   const withStats = !!req?.query?.withstats;
   try {
      const allDomains: Domain[] = await Domain.findAll();
      const formattedDomains: DomainType[] = allDomains.map((el) => {
         const domainItem = formatDomain(el);
         const scData = domainItem?.search_console ? JSON.parse(domainItem.search_console) : {};
         const { client_email, private_key } = scData;
         const searchConsoleData = scData ? { ...scData, client_email: client_email ? 'true' : '', private_key: private_key ? 'true' : '' } : {};
         return { ...domainItem, search_console: JSON.stringify(searchConsoleData) };
      });
      const theDomains: DomainType[] = withStats ? await getdomainStats(formattedDomains) : formattedDomains;
      return res.status(200).json({ domains: theDomains });
   } catch (error) {
      return res.status(400).json({ domains: [], error: 'Error Getting Domains.' });
   }
};

const addDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsAddResponse>) => {
   const { domains, tags } = req.body;
   const tagsToAttach = parseDomainTags(tags);
   if (domains && Array.isArray(domains) && domains.length > 0) {
      const domainsToAdd: any = [];

      domains.forEach((domain: string) => {
         domainsToAdd.push({
            domain: domain.trim(),
            slug: domain.trim().replaceAll('-', '_').replaceAll('.', '-').replaceAll('/', '-'),
            lastUpdated: new Date().toJSON(),
            added: new Date().toJSON(),
            tags: JSON.stringify(tagsToAttach),
         });
      });
      try {
         const newDomains:Domain[] = await Domain.bulkCreate(domainsToAdd);
         const formattedDomains = newDomains.map((el) => formatDomain(el));
         return res.status(201).json({ domains: formattedDomains });
      } catch (error) {
         console.log('[ERROR] Adding New Domain ', error);
         return res.status(400).json({ domains: [], error: 'Error Adding Domain.' });
      }
   } else {
      return res.status(400).json({ domains: [], error: 'Necessary data missing.' });
   }
};

export const deleteDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsDeleteRes>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, SCDataRemoved: false, error: 'Domain is Required!' });
   }
   try {
      const { domain } = req.query || {};
      await Promise.all((await Keyword.findAll({ where: { domain } })).map((keyword) => removeFromRetryQueue(keyword.ID)));
      const removedDomCount: number = await Domain.destroy({ where: { domain } });
      const removedKeywordCount: number = await Keyword.destroy({ where: { domain } });
      const SCDataRemoved = await removeLocalSCData(domain as string);

      return res.status(200).json({ domainRemoved: removedDomCount, keywordsRemoved: removedKeywordCount, SCDataRemoved });
   } catch (error) {
      console.log('[ERROR] Deleting Domain: ', req.query.domain, error);
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, SCDataRemoved: false, error: 'Error Deleting Domain' });
   }
};

export const updateDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsUpdateRes>) => {
   if (!req.query.domain) {
      return res.status(400).json({ domain: null, error: 'Domain is Required!' });
   }
   const { domain } = req.query || {};
   const {
      notification_interval, notification_emails, search_console,
      scrape_strategy, scrape_pagination_limit, scrape_smart_full_fallback,
      subdomain_matching, tags,
   } = req.body;

   try {
      const domainToUpdate: Domain|null = await Domain.findOne({ where: { domain } });
      if (!domainToUpdate) {
         return res.status(400).json({ domain: null, error: 'Domain not found.' });
      }

      // Tags-only update (from domain card attach UI)
      if (Array.isArray(tags) && notification_interval === undefined && search_console === undefined) {
         domainToUpdate.set({ tags: JSON.stringify(parseDomainTags(tags)) });
         await domainToUpdate.save();
         return res.status(200).json({ domain: formatDomain(domainToUpdate) });
      }

      // Validate Search Console API Data
      if (search_console?.client_email && search_console?.private_key) {
         const theDomainObj = domainToUpdate.get({ plain: true });
         const isSearchConsoleAPIValid = await checkSerchConsoleIntegration({ ...theDomainObj, search_console: JSON.stringify(search_console) });
         if (!isSearchConsoleAPIValid.isValid) {
            return res.status(400).json({ domain: null, error: isSearchConsoleAPIValid.error });
         }
         const cryptr = new Cryptr(process.env.SECRET as string);
         search_console.client_email = search_console.client_email ? cryptr.encrypt(search_console.client_email.trim()) : '';
         search_console.private_key = search_console.private_key ? cryptr.encrypt(search_console.private_key.trim()) : '';
      }

      const updatePayload: Record<string, unknown> = {
         notification_interval,
         notification_emails,
         search_console: JSON.stringify(search_console),
         scrape_strategy: scrape_strategy || '',
         scrape_pagination_limit: scrape_pagination_limit || 0,
         scrape_smart_full_fallback: !!scrape_smart_full_fallback,
         subdomain_matching: subdomain_matching || '',
      };
      if (Array.isArray(tags)) {
         updatePayload.tags = JSON.stringify(parseDomainTags(tags));
      }
      domainToUpdate.set(updatePayload);
      await domainToUpdate.save();
      return res.status(200).json({ domain: formatDomain(domainToUpdate) });
   } catch (error) {
      console.log('[ERROR] Updating Domain: ', req.query.domain, error);
      return res.status(400).json({ domain: null, error: 'Error Updating Domain. An Unknown Error Occurred.' });
   }
};
