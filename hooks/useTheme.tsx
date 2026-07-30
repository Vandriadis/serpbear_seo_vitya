import React, {
   createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
   theme: ThemeMode;
   toggleTheme: () => void;
   setTheme: (theme: ThemeMode) => void;
};

const STORAGE_KEY = 'serpbear-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

const getPreferredTheme = (): ThemeMode => {
   if (typeof window === 'undefined') return 'light';
   try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
   } catch {
      // ignore
   }
   return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeClass = (theme: ThemeMode) => {
   const root = document.documentElement;
   root.classList.toggle('dark', theme === 'dark');
   root.style.colorScheme = theme;
   const meta = document.querySelector('meta[name="theme-color"]');
   if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0f1117' : '#f8f9ff');
   }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
   const [theme, setThemeState] = useState<ThemeMode>('light');

   useEffect(() => {
      const initial = getPreferredTheme();
      setThemeState(initial);
      applyThemeClass(initial);
   }, []);

   const setTheme = useCallback((next: ThemeMode) => {
      setThemeState(next);
      applyThemeClass(next);
      try {
         window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
         // ignore
      }
   }, []);

   const toggleTheme = useCallback(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
   }, [setTheme, theme]);

   const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
   const ctx = useContext(ThemeContext);
   if (!ctx) {
      throw new Error('useTheme must be used within ThemeProvider');
   }
   return ctx;
};
