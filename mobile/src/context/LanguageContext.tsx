// Language Context - Global language state management
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import i18n, { Language, LANGUAGES } from '../i18n';

interface LanguageContextType {
  language: string;
  languageInfo: Language | undefined;
  setLanguage: (code: string) => Promise<boolean>;
  t: (key: string) => string;
  allLanguages: Language[];
  searchLanguages: (query: string) => Language[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(i18n.getLanguage());

  useEffect(() => {
    console.log('[LanguageContext] Setting up subscriber');
    const unsubscribe = i18n.subscribe(() => {
      const newLang = i18n.getLanguage();
      console.log('[LanguageContext] Language changed to:', newLang);
      setLanguageState(newLang);
    });
    return unsubscribe;
  }, []);

  const setLanguage = useCallback(async (code: string): Promise<boolean> => {
    const result = await i18n.setLanguage(code);
    return result;
  }, []);

  // Create a new t function every time language changes to force re-renders
  const t = useMemo(() => {
    console.log('[LanguageContext] Creating new t function for language:', language);
    return (key: string): string => {
      return i18n.t(key);
    };
  }, [language]);

  const searchLanguages = useCallback((query: string): Language[] => {
    return i18n.searchLanguages(query);
  }, []);

  const languageInfo = useMemo(() => i18n.getCurrentLanguageInfo(), [language]);
  const isRTL = languageInfo?.rtl || false;

  // Create new context value when language changes
  const contextValue = useMemo(() => ({
    language,
    languageInfo,
    setLanguage,
    t,
    allLanguages: LANGUAGES,
    searchLanguages,
    isRTL,
  }), [language, languageInfo, setLanguage, t, searchLanguages, isRTL]);

  return (
    <LanguageContext.Provider value={contextValue}>
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

export default LanguageContext;