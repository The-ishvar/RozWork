import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n, { loadLocale, supportedLanguages } from '../i18n'

const LanguageContext = createContext(null)

const defaultLanguage = 'en'

export const LanguageProvider = ({ children }) => {
   const [language, setLanguage] = useState(() => {
      if (typeof window === 'undefined') return defaultLanguage
      return localStorage.getItem('rozwork_language') || defaultLanguage
   })
   const [isReady, setIsReady] = useState(false)

   useEffect(() => {
      const currentLanguage = supportedLanguages.find((item) => item.code === language) ? language : defaultLanguage
      const load = async () => {
         try {
            await loadLocale(currentLanguage)
            await i18n.changeLanguage(currentLanguage)
            if (typeof window !== 'undefined') {
               localStorage.setItem('rozwork_language', currentLanguage)
               document.documentElement.lang = currentLanguage
               document.documentElement.dir = supportedLanguages.find((item) => item.code === currentLanguage)?.dir || 'ltr'
            }
         } catch (error) {
            console.error('Language load failed:', error)
         } finally {
            setIsReady(true)
         }
      }
      load()
   }, [language])

   const setLanguageAndPersist = (value) => {
      setLanguage((current) => {
         const next = supportedLanguages.some((item) => item.code === value) ? value : current
         return next
      })
   }

   const toggleLanguage = () => {
      setLanguage((current) => (current === 'en' ? 'hi' : 'en'))
   }

   const t = (key, fallback = '') => i18n.t(key, { defaultValue: fallback || key })

   const value = useMemo(
      () => ({ language, setLanguage: setLanguageAndPersist, supportedLanguages, toggleLanguage, isHindi: language === 'hi', dir: supportedLanguages.find((item) => item.code === language)?.dir || 'ltr', t, ready: isReady }),
      [language, isReady]
   )

   return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
