import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const supportedLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'hi', name: 'हिंदी', dir: 'ltr' },
]

const languageLoaders = {
  en: () => import('./locales/en/translation.json'),
  hi: () => import('./locales/hi/translation.json'),
}

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'en'
  return window.localStorage.getItem('rozwork_language') || 'en'
}

const currentLanguage = getStoredLanguage()

const ensureLanguageResource = async (language) => {
  if (!i18n.hasResourceBundle(language, 'translation')) {
    const loader = languageLoaders[language] || languageLoaders.en
    const resourceModule = await loader()
    const translation = resourceModule.default || resourceModule
    i18n.addResourceBundle(language, 'translation', translation, true, true)
  }
}

i18n.use(initReactI18next).init({
  lng: currentLanguage,
  fallbackLng: 'en',
  supportedLngs: supportedLanguages.map((item) => item.code),
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  resources: {},
})

ensureLanguageResource(currentLanguage).catch((error) => {
  console.error('Failed to load initial translation:', error)
})

export const loadLocale = async (language) => {
  await ensureLanguageResource(language)
}

export default i18n
