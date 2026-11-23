// i18n - Internationalization System
import AsyncStorage from '@react-native-async-storage/async-storage';
import LANGUAGES, { Language, getLanguageByCode, searchLanguages } from './languages';

// Import translations
import en from './translations/en';
import sw from './translations/sw';
import lg from './translations/lg';
import fr from './translations/fr';
import es from './translations/es';

// All translations - using any to allow partial translations that fallback to English
const translations: Record<string, any> = {
  en,
  sw,
  lg,
  fr,
  es,
  // Add more translations as needed - they will fallback to English
};

const LANGUAGE_STORAGE_KEY = '@gmg_language';
const DEFAULT_LANGUAGE = 'en';

class I18n {
  private currentLanguage: string = DEFAULT_LANGUAGE;
  private listeners: Set<() => void> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.loadSavedLanguage();
  }

  private async loadSavedLanguage() {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      console.log('[i18n] Loaded saved language:', saved);
      if (saved && (translations[saved] || getLanguageByCode(saved))) {
        this.currentLanguage = saved;
        this.notifyListeners();
      }
      this.initialized = true;
    } catch (error) {
      console.log('[i18n] Error loading language:', error);
      this.initialized = true;
    }
  }

  async setLanguage(code: string): Promise<boolean> {
    try {
      const language = getLanguageByCode(code);
      if (!language) {
        console.log('[i18n] Language not found:', code);
        return false;
      }

      console.log('[i18n] Setting language to:', code);
      this.currentLanguage = code;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      console.log('[i18n] Language saved, notifying listeners...');
      this.notifyListeners();
      console.log('[i18n] Listeners notified, count:', this.listeners.size);
      return true;
    } catch (error) {
      console.log('[i18n] Error saving language:', error);
      return false;
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  getCurrentLanguageInfo(): Language | undefined {
    return getLanguageByCode(this.currentLanguage);
  }

  getAllLanguages(): Language[] {
    return LANGUAGES;
  }

  searchLanguages(query: string): Language[] {
    return searchLanguages(query);
  }

  // Get translation with fallback to English
  t(key: string): string {
    const keys = key.split('.');
    let translation: any = translations[this.currentLanguage] || translations[DEFAULT_LANGUAGE];
    let fallback: any = translations[DEFAULT_LANGUAGE];

    for (const k of keys) {
      translation = translation?.[k];
      fallback = fallback?.[k];
    }

    return translation || fallback || key;
  }

  // Subscribe to language changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const i18n = new I18n();
export { LANGUAGES, Language, getLanguageByCode, searchLanguages };
export default i18n;