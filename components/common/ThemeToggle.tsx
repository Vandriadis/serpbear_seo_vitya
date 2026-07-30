import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import Icon from './Icon';

type ThemeToggleProps = {
   className?: string;
};

const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
   const { theme, toggleTheme } = useTheme();
   const isDark = theme === 'dark';

   return (
      <button
         type="button"
         onClick={toggleTheme}
         aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
         title={isDark ? 'Light theme' : 'Dark theme'}
         className={`theme-toggle group relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full
            border transition-colors duration-300 focus:outline-none focus-visible:ring-2
            focus-visible:ring-blue-500/60 focus-visible:ring-offset-2
            ${isDark
            ? 'border-slate-600 bg-slate-800 focus-visible:ring-offset-slate-900'
            : 'border-indigo-100 bg-indigo-50 focus-visible:ring-offset-white'}
            ${className}`}
      >
         <span
            className={`theme-toggle__thumb absolute left-[3px] top-[3px] flex h-[22px] w-[22px] items-center
               justify-center rounded-full shadow-sm transition-transform duration-300 ease-out
               ${isDark ? 'translate-x-[22px] bg-slate-100 text-slate-800' : 'translate-x-0 bg-white text-amber-500'}`}
         >
            <Icon type={isDark ? 'moon' : 'sun'} size={13} color="currentColor" />
         </span>
         <span className="sr-only">{isDark ? 'Dark' : 'Light'}</span>
      </button>
   );
};

export default ThemeToggle;
