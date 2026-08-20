import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import verifyUser, { denyUnlessWrite } from '../../utils/verifyUser';
import { checkDomainsHealth } from '../../utils/domainHealth';
import parseDomainTags from '../../utils/parseDomainTags';

type DomainHealthRes = {
   domains: DomainType[],
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const auth = verifyUser(req, res);
   if (!auth.ok) {
      return res.status(401).json({ error: auth.error });
   }
   if (req.method === 'POST') {
      if (denyUnlessWrite(auth, res)) { return undefined; }
      return refreshDomainHealth(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const refreshDomainHealth = async (req: NextApiRequest, res: NextApiResponse<DomainHealthRes>) => {
   const domainName = typeof req.query.domain === 'string'
      ? req.query.domain
      : (typeof req.body?.domain === 'string' ? req.body.domain : undefined);

   try {
      const domains = await checkDomainsHealth(domainName || undefined);
      const formatted = domains.map((d) => ({
         ...d,
         tags: parseDomainTags(d.tags),
      }));
      return res.status(200).json({ domains: formatted });
   } catch (error: any) {
      console.log('[ERROR] Domain Health Check: ', error);
      const message = error?.message === 'Domain not found' ? 'Domain not found' : 'Error checking domain health.';
      return res.status(400).json({ domains: [], error: message });
   }
};
