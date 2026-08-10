import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import { canWriteRole, useCurrentUser } from '../../services/auth';

type TopbarProps = {
   showSettings: Function,
   showAddModal: Function,
}

const TopBar = ({ showSettings, showAddModal }:TopbarProps) => {
   const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
   const router = useRouter();
   const { theme } = useTheme();
   const isDomainsPage = router.pathname === '/domains';
   const isDark = theme === 'dark';
   const activeIcon = isDark ? '#93a0ff' : '#1d4ed8';
   const mutedIcon = isDark ? '#94a3b8' : '#888';
   const { data: currentUserData } = useCurrentUser();
   const role = currentUserData?.user?.role;
   const canWrite = canWriteRole(role);
   const isViewer = role === 'viewer';

   const logoutUser = async () => {
      try {
         const fetchOpts = { method: 'POST', headers: new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' }) };
         const res = await fetch(`${window.location.origin}/api/logout`, fetchOpts).then((result) => result.json());
         console.log(res);
         if (!res.success) {
            toast(res.error, { icon: '⚠️' });
         } else {
            router.push('/login');
         }
      } catch (fetchError) {
         toast('Could not logout, The Server is not responsive.', { icon: '⚠️' });
      }
   };

   return (
       <div className={`topbar flex w-full mx-auto justify-between 
       ${isDomainsPage ? 'max-w-5xl lg:justify-between' : 'max-w-7xl lg:justify-end'}  bg-white lg:bg-transparent`}>

         <h3 className={`p-4 text-base font-bold text-blue-700 ${isDomainsPage ? 'lg:pl-0' : 'lg:hidden'}`}>
            <span className=' relative top-[3px] mr-1'><Icon type="logo" size={24} color="#364AFF" /></span> SerpBear
            {canWrite && (
               <button className='px-3 py-1 font-bold text-blue-700  lg:hidden ml-3 text-lg' onClick={() => showAddModal()}>+</button>
            )}
         </h3>
         {!isDomainsPage && router.asPath !== '/research' && (
            <Link href={'/domains'} passHref={true}>
               <a className=' right-14 top-2 px-2 py-1 cursor-pointer bg-[#ecf2ff] hover:bg-indigo-100 transition-all
               absolute lg:top-3 lg:right-auto lg:left-8 lg:px-3 lg:py-2 rounded-full'>
                  <Icon type="caret-left" size={16} title="Go Back" />
               </a>
            </Link>
         )}
         <div className="topbar__right flex items-center">
            <div className="hidden lg:flex items-center mr-2 mt-2">
               <ThemeToggle />
            </div>
            <button className={' lg:hidden p-3'} onClick={() => setShowMobileMenu(!showMobileMenu)}>
               <Icon type="hamburger" size={24} color={mutedIcon} />
            </button>
            <ul
            className={`text-sm font-semibold text-gray-500 absolute mt-[-10px] right-3 bg-white 
            border border-gray-200 lg:mt-2 lg:relative lg:block lg:border-0 lg:bg-transparent ${showMobileMenu ? 'block' : 'hidden'}`}>
               <li className="block lg:hidden px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                     <span>Theme</span>
                     <ThemeToggle />
                  </div>
               </li>
               <li className={`block lg:inline-block lg:ml-5 ${router.asPath === '/domains' ? ' text-blue-700' : ''}`}>
                  <Link href={'/domains'} passHref={true}>
                     <a className='block px-3 py-2 cursor-pointer'>
                        <Icon type="domains" color={router.asPath === '/domains' ? activeIcon : mutedIcon} size={14} /> Domains
                     </a>
                  </Link>
               </li>
               {!isViewer && (
                  <li className={`block lg:inline-block lg:ml-5 ${router.asPath === '/research' ? ' text-blue-700' : ''}`}>
                     <Link href={'/research'} passHref={true}>
                        <a className='block px-3 py-2 cursor-pointer'>
                           <Icon type="research" color={router.asPath === '/research' ? activeIcon : mutedIcon} size={14} /> Research
                        </a>
                     </Link>
                  </li>
               )}
               {!isViewer && (
                  <li className='block lg:inline-block lg:ml-5'>
                     <a className='block px-3 py-2 cursor-pointer' onClick={() => showSettings()}>
                        <Icon type="settings-alt" color={mutedIcon} size={14} /> Settings
                     </a>
                  </li>
               )}
               {currentUserData?.user?.username && (
                  <li className='block lg:inline-block lg:ml-5'>
                     <span className='block px-3 py-2 text-xs text-gray-400 capitalize'>
                        {currentUserData.user.username} ({currentUserData.user.role})
                     </span>
                  </li>
               )}
               <li className='block lg:inline-block lg:ml-5'>
                  <a className='block px-3 py-2 cursor-pointer' href='https://docs.serpbear.com/' target="_blank" rel='noreferrer'>
                     <Icon type="question" color={mutedIcon} size={14} /> Help
                  </a>
               </li>
               <li className='block lg:inline-block lg:ml-5'>
                  <a className='block px-3 py-2 cursor-pointer' onClick={() => logoutUser()}>
                     <Icon type="logout" color={mutedIcon} size={14} /> Logout
                  </a>
               </li>
            </ul>
         </div>
       </div>
   );
 };

 export default TopBar;
