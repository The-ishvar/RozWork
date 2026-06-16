import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import en from '../i18n/locales/en'
import hi from '../i18n/locales/hi'

const LanguageContext = createContext(null)
const LANGUAGE_KEY = 'rozwork_language'
const SUPPORTED_LANGUAGES = ['en', 'hi']
const DEFAULT_LANGUAGE = 'en'
const translations = { en, hi }

export function LanguageProvider({ children }) {
   const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
   const [loaded, setLoaded] = useState(false)

   const loadLanguage = async () => {
      const stored = await SecureStore.getItemAsync(LANGUAGE_KEY)
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
         setLanguage(stored)
      }
      setLoaded(true)
   }

   useEffect(() => {
      loadLanguage()
   }, [])

   const setLanguageAndPersist = async (nextLanguage) => {
      if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
         nextLanguage = DEFAULT_LANGUAGE
      }
      setLanguage(nextLanguage)
      await SecureStore.setItemAsync(LANGUAGE_KEY, nextLanguage)
   }

   const toggleLanguage = async () => {
      await setLanguageAndPersist(language === 'en' ? 'hi' : 'en')
   }

   const t = (key, fallback) => {
      const value = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), translations[language])
      return value ?? fallback ?? key
   }

   const value = useMemo(
      () => ({
         language,
         loaded,
         setLanguage: setLanguageAndPersist,
         toggleLanguage,
         t,
      }),
      [language, loaded]
   )

   return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
   return useContext(LanguageContext)
}
