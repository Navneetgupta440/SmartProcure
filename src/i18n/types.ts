export type SupportedLanguage = 'en' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dateFormat: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    dateFormat: 'MM/DD/YYYY',
    region: 'North America / Global',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dateFormat: 'DD/MM/YYYY',
    region: 'España / Latinoamérica',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dateFormat: 'DD/MM/YYYY',
    region: 'France / Canada / Europe',
  },
];
