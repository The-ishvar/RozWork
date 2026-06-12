import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getTranslation } from './translations'

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
   const [language, setLanguage] = useState(() => {
      if (typeof window === 'undefined') return 'en'
      return localStorage.getItem('rozwork_language') || 'en'
   })

   useEffect(() => {
      if (typeof window !== 'undefined') {
         localStorage.setItem('rozwork_language', language)
      }
   }, [language])

   const toggleLanguage = () => {
      setLanguage((current) => (current === 'en' ? 'hi' : 'en'))
   }

   const t = (key, fallback = '') => getTranslation(language, key, fallback)

   const value = useMemo(() => ({ language, setLanguage, toggleLanguage, isHindi: language === 'hi', t }), [language])

   return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
