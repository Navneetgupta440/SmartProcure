import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { SupportedLanguage } from '../../i18n/types';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'cards';
  className?: string;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
  onLanguageChange,
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageOption, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {supportedLanguages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                      {lang.nativeName}
                    </p>
                    <p className="text-[10px] text-slate-500">{lang.name}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span>{lang.region}</span>
                <span className="font-mono">{lang.dateFormat}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs group"
        title="Change interface language"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentLanguageOption.flag}</span>
        <span className="hidden sm:inline-block uppercase tracking-wider text-[11px] font-bold text-slate-800">
          {currentLanguageOption.code}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Interface Language
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer ${
                  isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <span className="block leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
