import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Hash a password with scrypt. Stored format: salt:hash (hex).
 */
export const hashPassword = (password: string): string => {
   const salt = randomBytes(16).toString('hex');
   const hash = scryptSync(password, salt, 64).toString('hex');
   return `${salt}:${hash}`;
};

/**
 * Verify a password against a stored salt:hash value.
 */
export const verifyPassword = (password: string, stored: string): boolean => {
   if (!stored || !stored.includes(':')) { return false; }
   const [salt, hash] = stored.split(':');
   if (!salt || !hash) { return false; }
   try {
      const hashBuffer = Buffer.from(hash, 'hex');
      const supplied = scryptSync(password, salt, 64);
      if (hashBuffer.length !== supplied.length) { return false; }
      return timingSafeEqual(hashBuffer, supplied);
   } catch (error) {
      return false;
   }
};
