import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ca from './locales/ca.json';
import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const SUPPORTED_LANGUAGES = ['ca', 'es', 'en', 'fr'];
const STORAGE_KEY = 'uxia_lang';

const resolveInitialLanguage = () => {
  const persisted = localStorage.getItem(STORAGE_KEY);
  if (persisted && SUPPORTED_LANGUAGES.includes(persisted)) {
    return persisted;
  }

  const browserLanguage = (navigator.language || 'en').split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ca: { translation: ca },
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (language) => {
  localStorage.setItem(STORAGE_KEY, language);
  document.documentElement.lang = language;
});

export default i18n;
