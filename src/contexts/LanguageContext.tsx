import { createContext, useContext, useState, ReactNode } from 'react';
import en from '@/locales/en.json';

type Locale = 'en' | 'tr' | 'de';

type Translations = typeof en;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const translations: Record<Locale, Translations> = {
  en,
  tr: en, // Placeholder - will be replaced with Turkish translations
  de: en, // Placeholder - will be replaced with German translations
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key does not resolve to string: ${key}`);
      return key;
    }
    
    // Replace params like {count} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, translations: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Simple hook for translations
export function useTranslation() {
  const { t, locale } = useLanguage();
  return { t, locale };
}
