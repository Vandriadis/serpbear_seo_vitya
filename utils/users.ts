import User from '../database/models/user';
import { hashPassword } from './password';

export const USER_ROLES = ['admin', 'seo', 'viewer'] as const;
export type UserRole = typeof USER_ROLES[number];

export const DEFAULT_ADMIN_PASSWORD = 'vityavovaserpbear';

export const isValidRole = (role: string): role is UserRole => USER_ROLES.includes(role as UserRole);

export const getDefaultAdminUsername = (): string => (
   process.env.USER_NAME || process.env.USER || 'admin'
);

/**
 * Ensure the users table exists and seed the default admin account when empty.
 */
export const ensureDefaultAdmin = async (): Promise<void> => {
   await User.sync();
   const count = await User.count();
   if (count > 0) { return; }

   const username = getDefaultAdminUsername();
   await User.create({
      username,
      password: hashPassword(DEFAULT_ADMIN_PASSWORD),
      role: 'admin',
      created: new Date().toJSON(),
   });
   console.log(`[AUTH] Seeded default admin user "${username}"`);
};

export const sanitizeUser = (user: User | { ID: number, username: string, role: string, created?: string }): AppUser => ({
   ID: user.ID,
   username: user.username,
   role: user.role as UserRole,
   created: user.created || '',
});
