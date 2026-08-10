import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import User from '../../database/models/user';
import verifyUser from '../../utils/verifyUser';
import { ensureDefaultAdmin, sanitizeUser } from '../../utils/users';

type MeResponse = {
   user?: AppUser | null,
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   await ensureDefaultAdmin();
   const auth = verifyUser(req, res);
   if (!auth.ok) {
      return res.status(401).json({ error: auth.error });
   }
   if (req.method === 'GET') {
      return getMe(req, res, auth.user);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getMe = async (_req: NextApiRequest, res: NextApiResponse<MeResponse>, authUser?: { id: number, username: string, role: UserRole }) => {
   if (!authUser) {
      return res.status(401).json({ error: 'Not authorized' });
   }
   if (authUser.id > 0) {
      const found = await User.findByPk(authUser.id);
      if (found) {
         return res.status(200).json({ user: sanitizeUser(found) });
      }
   }
   return res.status(200).json({
      user: {
         ID: authUser.id,
         username: authUser.username,
         role: authUser.role,
      },
   });
};
