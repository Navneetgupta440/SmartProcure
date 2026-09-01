import { en, TranslationKey } from './en';
import { es } from './es';
import { fr } from './fr';
import { SupportedLanguage } from '../types';

export const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en,
  es,
  fr,
};

export { en, es, fr };
export type { TranslationKey };
