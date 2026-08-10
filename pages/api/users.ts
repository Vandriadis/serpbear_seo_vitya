import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import User from '../../database/models/user';
import verifyUser, { denyUnlessAdmin } from '../../utils/verifyUser';
import { hashPassword } from '../../utils/password';
import { ensureDefaultAdmin, isValidRole, sanitizeUser } from '../../utils/users';

type UsersListRes = {
   users?: AppUser[],
   error?: string,
}

type UserMutateRes = {
   user?: AppUser | null,
   success?: boolean,
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   await ensureDefaultAdmin();
   const auth = verifyUser(req, res);
   if (!auth.ok) {
      return res.status(401).json({ error: auth.error });
   }
   if (denyUnlessAdmin(auth, res)) {
      return undefined;
   }

   if (req.method === 'GET') {
      return listUsers(req, res);
   }
   if (req.method === 'POST') {
      return createUser(req, res);
   }
   if (req.method === 'PUT') {
      return updateUser(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteUser(req, res, auth.user?.id);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const listUsers = async (_req: NextApiRequest, res: NextApiResponse<UsersListRes>) => {
   try {
      const users = await User.findAll({ order: [['ID', 'ASC']] });
      return res.status(200).json({ users: users.map((u) => sanitizeUser(u)) });
   } catch (error) {
      console.log('[ERROR] Listing users', error);
      return res.status(400).json({ error: 'Error loading users.' });
   }
};

const createUser = async (req: NextApiRequest, res: NextApiResponse<UserMutateRes>) => {
   const { username, password, role } = req.body || {};
   if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password and role are required.' });
   }
   if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid role. Use admin, seo or viewer.' });
   }
   if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
   }

   try {
      const existing = await User.findOne({ where: { username: String(username).trim() } });
      if (existing) {
         return res.status(400).json({ error: 'Username already exists.' });
      }
      const created = await User.create({
         username: String(username).trim(),
         password: hashPassword(String(password)),
         role,
         created: new Date().toJSON(),
      });
      return res.status(201).json({ user: sanitizeUser(created) });
   } catch (error) {
      console.log('[ERROR] Creating user', error);
      return res.status(400).json({ error: 'Error creating user.' });
   }
};

const updateUser = async (req: NextApiRequest, res: NextApiResponse<UserMutateRes>) => {
   const id = parseInt(String(req.query.id || req.body?.id || ''), 10);
   if (!id) {
      return res.status(400).json({ error: 'User ID is required.' });
   }

   const { username, password, role } = req.body || {};
   try {
      const user = await User.findByPk(id);
      if (!user) {
         return res.status(404).json({ error: 'User not found.' });
      }

      if (role) {
         if (!isValidRole(role)) {
            return res.status(400).json({ error: 'Invalid role. Use admin, seo or viewer.' });
         }
         if (user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
               return res.status(400).json({ error: 'Cannot demote the last admin.' });
            }
         }
         user.role = role;
      }

      if (username) {
         const trimmed = String(username).trim();
         const conflict = await User.findOne({ where: { username: trimmed } });
         if (conflict && conflict.ID !== user.ID) {
            return res.status(400).json({ error: 'Username already exists.' });
         }
         user.username = trimmed;
      }

      if (password) {
         if (String(password).length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
         }
         user.password = hashPassword(String(password));
      }

      await user.save();
      return res.status(200).json({ user: sanitizeUser(user) });
   } catch (error) {
      console.log('[ERROR] Updating user', error);
      return res.status(400).json({ error: 'Error updating user.' });
   }
};

const deleteUser = async (req: NextApiRequest, res: NextApiResponse<UserMutateRes>, currentUserId?: number) => {
   const id = parseInt(String(req.query.id || ''), 10);
   if (!id) {
      return res.status(400).json({ error: 'User ID is required.' });
   }
   if (currentUserId && currentUserId === id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
   }

   try {
      const user = await User.findByPk(id);
      if (!user) {
         return res.status(404).json({ error: 'User not found.' });
      }
      if (user.role === 'admin') {
         const adminCount = await User.count({ where: { role: 'admin' } });
         if (adminCount <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin.' });
         }
      }
      await user.destroy();
      return res.status(200).json({ success: true });
   } catch (error) {
      console.log('[ERROR] Deleting user', error);
      return res.status(400).json({ error: 'Error deleting user.' });
   }
};
