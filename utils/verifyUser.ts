import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';

export type AuthPayload = {
   id: number,
   username: string,
   role: UserRole,
}

export type AuthResult = {
   ok: boolean,
   error?: string,
   user?: AuthPayload,
   viaApiKey?: boolean,
}

const VIEWER_ALLOWED_GET = [
   '/api/me',
   '/api/domains',
   '/api/domain',
   '/api/keywords',
   '/api/keyword',
   '/api/insight',
   '/api/searchconsole',
   '/api/settings',
   '/api/dbmigrate',
];

const VIEWER_ALLOWED_POST = [
   '/api/logout',
];

const API_KEY_ALLOWED_ROUTES = [
   'GET:/api/keyword',
   'GET:/api/keywords',
   'GET:/api/domains',
   'POST:/api/refresh',
   'POST:/api/cron',
   'POST:/api/notify',
   'POST:/api/searchconsole',
   'GET:/api/searchconsole',
   'GET:/api/insight',
   'POST:/api/domain-health',
];

const normalizePath = (url?: string): string => (url || '').replace(/\?(.*)/, '');

/**
 * Verifies the user by cookie JWT or system API key.
 * Viewers are limited to read-only domain/keyword endpoints and cannot use the API key.
 */
const verifyUser = (req: NextApiRequest, res: NextApiResponse): AuthResult => {
   const cookies = new Cookies(req, res);
   const token = cookies && cookies.get('token');
   const path = normalizePath(req.url);
   const method = req.method || 'GET';
   console.log(method, req.url);

   const bearer = req.headers.authorization ? req.headers.authorization.substring('Bearer '.length) : '';
   const verifiedAPI = !!(process.env.APIKEY && bearer && bearer === process.env.APIKEY);
   const accessingAllowedRoute = API_KEY_ALLOWED_ROUTES.includes(`${method}:${path}`);

   if (token && process.env.SECRET) {
      try {
         const decoded = jwt.verify(token, process.env.SECRET) as jwt.JwtPayload & Partial<AuthPayload> & { user?: string };
         const role = (decoded.role || 'admin') as UserRole;
         const username = decoded.username || decoded.user || '';
         const id = typeof decoded.id === 'number' ? decoded.id : 0;
         const user: AuthPayload = { id, username, role };

         if (role === 'viewer') {
            const allowedGet = method === 'GET' && VIEWER_ALLOWED_GET.includes(path);
            const allowedPost = method === 'POST' && VIEWER_ALLOWED_POST.includes(path);
            if (!allowedGet && !allowedPost) {
               return { ok: false, error: 'Read-only access. This action requires SEO or Admin role.', user };
            }
         }

         return { ok: true, user };
      } catch (err) {
         return { ok: false, error: 'Not authorized' };
      }
   }

   if (verifiedAPI && accessingAllowedRoute) {
      // System API key is for cron/integrations only — not end-user viewer access.
      return {
         ok: true,
         viaApiKey: true,
         user: { id: 0, username: 'api', role: 'admin' },
      };
   }

   if (!token) {
      if (req.headers.authorization && !verifiedAPI) {
         return { ok: false, error: 'Invalid API Key Provided.' };
      }
      if (verifiedAPI && !accessingAllowedRoute) {
         return { ok: false, error: 'This Route cannot be accessed with API.' };
      }
      return { ok: false, error: 'Not authorized' };
   }

   if (token && !process.env.SECRET) {
      return { ok: false, error: 'Token has not been Setup.' };
   }

   return { ok: false, error: 'Not authorized' };
};

export const canWrite = (auth: AuthResult): boolean => {
   if (!auth.ok) { return false; }
   if (auth.viaApiKey) { return true; }
   return auth.user?.role === 'admin' || auth.user?.role === 'seo';
};

export const isAdmin = (auth: AuthResult): boolean => {
   if (!auth.ok) { return false; }
   if (auth.viaApiKey) { return true; }
   return auth.user?.role === 'admin';
};

export const denyUnlessWrite = (auth: AuthResult, res: NextApiResponse): boolean => {
   if (canWrite(auth)) { return false; }
   res.status(403).json({ error: 'Read-only access. Contact an admin for write permissions.' });
   return true;
};

export const denyUnlessAdmin = (auth: AuthResult, res: NextApiResponse): boolean => {
   if (isAdmin(auth)) { return false; }
   res.status(403).json({ error: 'Admin access required.' });
   return true;
};

export default verifyUser;
