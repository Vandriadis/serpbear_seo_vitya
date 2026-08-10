import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';
import db from '../../database/database';
import User from '../../database/models/user';
import { verifyPassword } from '../../utils/password';
import { ensureDefaultAdmin } from '../../utils/users';

type loginResponse = {
   success?: boolean
   error?: string|null,
   user?: AppUser,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method === 'POST') {
      return loginUser(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const loginUser = async (req: NextApiRequest, res: NextApiResponse<loginResponse>) => {
   if (!req.body.username || !req.body.password) {
      return res.status(401).json({ error: 'Username Password Missing' });
   }
   if (!process.env.SECRET) {
      return res.status(401).json({ success: false, error: 'SECRET has not been Setup.' });
   }

   try {
      await db.sync();
      await ensureDefaultAdmin();

      const username = String(req.body.username).trim();
      const password = String(req.body.password);
      const found = await User.findOne({ where: { username } });

      if (!found || !verifyPassword(password, found.password)) {
         const error = !found ? 'Incorrect Username' : 'Incorrect Password';
         return res.status(401).json({ success: false, error });
      }

      const role = (found.role || 'viewer') as UserRole;
      const token = jwt.sign(
         { id: found.ID, username: found.username, role, user: found.username },
         process.env.SECRET,
      );
      const cookies = new Cookies(req, res);
      const expireDate = new Date();
      const sessDuration = process.env.SESSION_DURATION;
      expireDate.setHours((sessDuration && parseInt(sessDuration, 10)) || 24);
      cookies.set('token', token, { httpOnly: true, sameSite: 'lax', maxAge: expireDate.getTime() });

      return res.status(200).json({
         success: true,
         error: null,
         user: {
            ID: found.ID,
            username: found.username,
            role,
            created: found.created,
         },
      });
   } catch (error) {
      console.log('[ERROR] Login failed', error);
      return res.status(500).json({ success: false, error: 'Login failed due to a server error.' });
   }
};
