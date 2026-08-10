import React, { useState } from 'react';
import Icon from '../common/Icon';
import SelectField from '../common/SelectField';
import { useCreateUser, useDeleteUser, useFetchUsers, useUpdateUser } from '../../services/auth';

const roleOptions = [
   { label: 'Admin — full access + manage users', value: 'admin' },
   { label: 'SEO — full access without user management', value: 'seo' },
   { label: 'Viewer — read-only domains & keywords', value: 'viewer' },
];

const UserSettings = () => {
   const { data, isLoading } = useFetchUsers(true);
   const { mutate: createUser, isLoading: isCreating } = useCreateUser();
   const { mutate: updateUser, isLoading: isUpdating } = useUpdateUser();
   const { mutate: deleteUser } = useDeleteUser();

   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');
   const [role, setRole] = useState<UserRole>('viewer');
   const [editingId, setEditingId] = useState<number | null>(null);
   const [editPassword, setEditPassword] = useState('');

   const users: AppUser[] = data?.users || [];

   const resetForm = () => {
      setUsername('');
      setPassword('');
      setRole('viewer');
   };

   const submitCreate = () => {
      if (!username.trim() || !password) { return; }
      createUser({ username: username.trim(), password, role }, {
         onSuccess: () => resetForm(),
      });
   };

   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700';
   const inputStyle = 'w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none focus:border-blue-200';

   return (
      <div className='settings__content styled-scrollbar p-6 text-sm'>
         <div className='settings__section__input mb-6'>
            <h4 className='font-semibold text-base mb-1'>Users</h4>
            <p className='text-gray-500 text-xs mb-4'>
               Only admins can create and manage users. SEO has the same app access without this panel.
               Viewers can only browse domains and keyword positions.
            </p>

            {isLoading && <Icon type="loading" size={18} />}

            <ul className='mb-6 divide-y border rounded'>
               {users.map((user) => (
                  <li key={user.ID} className='p-3 flex flex-col gap-2'>
                     <div className='flex items-center justify-between gap-2'>
                        <div>
                           <div className='font-semibold'>{user.username}</div>
                           <div className='text-xs text-gray-500 capitalize'>{user.role}</div>
                        </div>
                        <div className='flex gap-2'>
                           <button
                              className='text-blue-600 text-xs font-semibold'
                              onClick={() => {
                                 setEditingId(editingId === user.ID ? null : user.ID);
                                 setEditPassword('');
                              }}
                           >
                              Edit
                           </button>
                           <button
                              className='text-red-500 text-xs font-semibold'
                              onClick={() => {
                                 if (window.confirm(`Delete user "${user.username}"?`)) {
                                    deleteUser(user.ID);
                                 }
                              }}
                           >
                              Delete
                           </button>
                        </div>
                     </div>
                     {editingId === user.ID && (
                        <div className='bg-slate-50 rounded p-3'>
                           <label className={labelStyle}>Role</label>
                           <SelectField
                              selected={[user.role]}
                              options={roleOptions}
                              defaultLabel="Role"
                              updateField={(updated: string[]) => {
                                 if (updated[0]) {
                                    updateUser({ id: user.ID, role: updated[0] as UserRole });
                                 }
                              }}
                              multiple={false}
                              rounded="rounded"
                           />
                           <label className={`${labelStyle} mt-3`}>New Password (optional)</label>
                           <input
                              className={inputStyle}
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Leave blank to keep current"
                           />
                           <button
                              className='py-2 px-4 rounded bg-blue-700 text-white text-xs font-semibold'
                              disabled={isUpdating || !editPassword}
                              onClick={() => {
                                 if (editPassword) {
                                    updateUser({ id: user.ID, password: editPassword }, {
                                       onSuccess: () => {
                                          setEditPassword('');
                                          setEditingId(null);
                                       },
                                    });
                                 }
                              }}
                           >
                              Update Password
                           </button>
                        </div>
                     )}
                  </li>
               ))}
               {!isLoading && users.length === 0 && (
                  <li className='p-3 text-gray-500'>No users found.</li>
               )}
            </ul>

            <h4 className='font-semibold mb-3'>Create User</h4>
            <label className={labelStyle}>Username</label>
            <input className={inputStyle} type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            <label className={labelStyle}>Password</label>
            <input className={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label className={labelStyle}>Role</label>
            <div className='mb-4'>
               <SelectField
                  selected={[role]}
                  options={roleOptions}
                  defaultLabel="Role"
                  updateField={(updated: string[]) => updated[0] && setRole(updated[0] as UserRole)}
                  multiple={false}
                  rounded="rounded"
               />
            </div>
            <button
               className='py-3 px-5 w-full rounded cursor-pointer bg-blue-700 text-white font-semibold text-sm'
               disabled={isCreating || !username.trim() || !password}
               onClick={submitCreate}
            >
               {isCreating ? <Icon type="loading" size={14} /> : null} Create User
            </button>
         </div>
      </div>
   );
};

export default UserSettings;
