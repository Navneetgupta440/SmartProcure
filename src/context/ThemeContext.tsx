/**
 * Theme Context for ProcureFlow Enterprise
 * Supports Light, Dark, Midnight, and Executive Navy color schemes
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'midnight' | 'cyber';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('procureflow_theme') as ThemeMode;
    if (saved && ['light', 'dark', 'midnight', 'cyber'].includes(saved)) {
      return saved;
    }
    return 'dark'; // Default modern enterprise theme
  });

  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'cyber';

  useEffect(() => {
    localStorage.setItem('procureflow_theme', theme);
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('dark', 'theme-light', 'theme-dark', 'theme-midnight', 'theme-cyber');

    // Add active classes
    root.classList.add(`theme-${theme}`);
    if (isDark) {
      root.classList.add('dark');
    }
  }, [theme, isDark]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
