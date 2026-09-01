/**
 * Theme Selector Component for ProcureFlow Enterprise
 * Allows switching between Dark, Light, Midnight, and Cyber modes
 */

import React from 'react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { Sun, Moon, Sparkles, Shield } from 'lucide-react';

interface ThemeSelectorProps {
  variant?: 'compact' | 'cards';
  onThemeChange?: (theme: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'compact', onThemeChange }) => {
  const { theme, setTheme, isDark } = useTheme();

  const themes: { id: ThemeMode; label: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'dark',
      label: 'Deep Slate Dark',
      icon: Moon,
      color: 'bg-slate-900 text-slate-100 border-slate-700',
      desc: 'Modern high-contrast dark executive canvas',
    },
    {
      id: 'midnight',
      label: 'Midnight Sapphire',
      icon: Sparkles,
      color: 'bg-slate-950 text-indigo-300 border-indigo-900',
      desc: 'Rich navy blue enterprise dark mode',
    },
    {
      id: 'light',
      label: 'Corporate Light',
      icon: Sun,
      color: 'bg-white text-slate-900 border-slate-200',
      desc: 'Clean corporate crisp white layout',
    },
    {
      id: 'cyber',
      label: 'Cyber Emerald',
      icon: Shield,
      color: 'bg-zinc-950 text-emerald-300 border-emerald-900',
      desc: 'Fintech high-tech emerald telemetry theme',
    },
  ];

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {themes.map((t) => {
          const Icon = t.icon;
          const isSelected = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                if (onThemeChange) onThemeChange(t.id);
              }}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.label}</span>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.desc}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
      {themes.slice(0, 3).map((t) => {
        const Icon = t.icon;
        const isSelected = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTheme(t.id);
              if (onThemeChange) onThemeChange(t.id);
            }}
            title={t.label}
            className={`p-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
};
