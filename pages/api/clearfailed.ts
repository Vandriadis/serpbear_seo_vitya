import { writeFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser, { denyUnlessWrite } from '../../utils/verifyUser';

type SettingsGetResponse = {
   cleared?: boolean,
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const auth = verifyUser(req, res);
   if (!auth.ok) {
      return res.status(401).json({ error: auth.error });
   }
   if (req.method === 'PUT') {
      if (denyUnlessWrite(auth, res)) { return undefined; }
      return clearFailedQueue(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const clearFailedQueue = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>) => {
   try {
      await writeFile(`${process.cwd()}/data/failed_queue.json`, JSON.stringify([]), { encoding: 'utf-8' });
      return res.status(200).json({ cleared: true });
   } catch (error) {
      console.log('[ERROR] Clearing Failed Queue File.', error);
      return res.status(200).json({ error: 'Error Clearing Failed Queue!' });
   }
};
