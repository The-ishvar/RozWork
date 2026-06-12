import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
   const [theme, setTheme] = useState(() => localStorage.getItem('rozwork_theme') || 'light')

   useEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('rozwork_theme', theme)
   }, [theme])

   const toggleTheme = () => {
      setTheme((current) => (current === 'light' ? 'dark' : 'light'))
   }

   const value = useMemo(() => ({ theme, toggleTheme }), [theme])

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
