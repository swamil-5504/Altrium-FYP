import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import mr from '@/locales/mr.json';

export const APP_LANGUAGE_STORAGE_KEY = 'app-language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: APP_LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
