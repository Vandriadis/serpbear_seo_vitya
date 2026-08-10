import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

export async function fetchCurrentUser(): Promise<{ user?: AppUser | null, error?: string }> {
   const res = await fetch(`${window.location.origin}/api/me`, { method: 'GET' });
   if (res.status === 401) {
      return { user: null };
   }
   return res.json();
}

export function useCurrentUser() {
   return useQuery('currentUser', () => fetchCurrentUser(), {
      retry: false,
      staleTime: 60_000,
   });
}

export function useFetchUsers(enabled = true) {
   return useQuery('users', async () => {
      const res = await fetch(`${window.location.origin}/api/users`, { method: 'GET' });
      if (res.status >= 400) {
         throw new Error('Failed to load users');
      }
      return res.json() as Promise<{ users: AppUser[] }>;
   }, { enabled, retry: false });
}

type CreateUserPayload = { username: string, password: string, role: UserRole };
type UpdateUserPayload = { id: number, username?: string, password?: string, role?: UserRole };

export function useCreateUser() {
   const queryClient = useQueryClient();
   return useMutation(async (payload: CreateUserPayload) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const res = await fetch(`${window.location.origin}/api/users`, {
         method: 'POST',
         headers,
         body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status >= 400) {
         throw new Error(data.error || 'Failed to create user');
      }
      return data;
   }, {
      onSuccess: () => {
         toast('User created', { icon: '✔️' });
         queryClient.invalidateQueries(['users']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error creating user', { icon: '⚠️' });
      },
   });
}

export function useUpdateUser() {
   const queryClient = useQueryClient();
   return useMutation(async (payload: UpdateUserPayload) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const res = await fetch(`${window.location.origin}/api/users?id=${payload.id}`, {
         method: 'PUT',
         headers,
         body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status >= 400) {
         throw new Error(data.error || 'Failed to update user');
      }
      return data;
   }, {
      onSuccess: () => {
         toast('User updated', { icon: '✔️' });
         queryClient.invalidateQueries(['users']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error updating user', { icon: '⚠️' });
      },
   });
}

export function useDeleteUser() {
   const queryClient = useQueryClient();
   return useMutation(async (id: number) => {
      const res = await fetch(`${window.location.origin}/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.status >= 400) {
         throw new Error(data.error || 'Failed to delete user');
      }
      return data;
   }, {
      onSuccess: () => {
         toast('User deleted', { icon: '✔️' });
         queryClient.invalidateQueries(['users']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error deleting user', { icon: '⚠️' });
      },
   });
}

export const canWriteRole = (role?: UserRole | string | null): boolean => role === 'admin' || role === 'seo';
export const isAdminRole = (role?: UserRole | string | null): boolean => role === 'admin';
