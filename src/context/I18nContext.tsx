import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../i18n/types';
import { translations, TranslationKey, en } from '../i18n/translations';

const STORAGE_KEY = 'procureflow_language';

interface I18nContextType {
  language: SupportedLanguage;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>, defaultValue?: string) => string;
  formatDate: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'es' || saved === 'fr')) {
        return saved as SupportedLanguage;
      }
      // Also check browser navigator language as initial fallback if not saved
      const browserLang = navigator.language?.split('-')[0];
      if (browserLang === 'es') return 'es';
      if (browserLang === 'fr') return 'fr';
    } catch {
      // ignore storage errors
    }
    return 'en';
  });

  const currentLanguageOption = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      console.warn('Failed to save language preference to storage', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>, defaultValue?: string): string => {
      const dict = translations[language] || translations.en;
      let text = (dict as Record<string, string>)[key] || (en as Record<string, string>)[key] || defaultValue || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(val));
          text = text.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), String(val));
        });
      }

      return text;
    },
    [language]
  );

  const formatDate = useCallback(
    (date: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        const localeMap: Record<SupportedLanguage, string> = {
          en: 'en-US',
          es: 'es-ES',
          fr: 'fr-FR',
        };
        const defaultOptions: Intl.DateTimeFormatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };
        return new Intl.DateTimeFormat(localeMap[language] || 'en-US', defaultOptions).format(d);
      } catch (err) {
        return String(date);
      }
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number, currencyCode = 'INR'): string => {
      try {
        const localeMap: Record<SupportedLanguage, string> = {
          en: 'en-IN',
          es: 'es-ES',
          fr: 'fr-FR',
        };
        return new Intl.NumberFormat(localeMap[language] || 'en-IN', {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch (err) {
        return '₹' + amount.toLocaleString();
      }
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        currentLanguageOption,
        supportedLanguages: SUPPORTED_LANGUAGES,
        setLanguage,
        t,
        formatDate,
        formatCurrency,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Convenience alias
export const useTranslation = useI18n;
