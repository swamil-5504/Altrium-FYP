import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGE_STORAGE_KEY } from '@/i18n/config';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [language, setLanguageState] = useState(i18n.resolvedLanguage || 'en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'en';
    i18n.changeLanguage(savedLanguage);
    setLanguageState(savedLanguage);
  }, [i18n]);

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
