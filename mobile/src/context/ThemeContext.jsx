import React, { createContext, useContext, useMemo, useState } from 'react'

const themes = {
   light: {
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      primary: '#2563eb',
      accent: '#14b8a6',
      border: '#e2e8f0',
      card: '#ffffff',
      danger: '#ef4444',
   },
   dark: {
      background: '#020617',
      surface: '#111827',
      text: '#f8fafc',
      muted: '#94a3b8',
      primary: '#60a5fa',
      accent: '#34d399',
      border: '#334155',
      card: '#111827',
      danger: '#f87171',
   },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
   const [isDark, setIsDark] = useState(false)
   const value = useMemo(() => ({
      isDark,
      theme: isDark ? themes.dark : themes.light,
      toggleTheme: () => setIsDark((prev) => !prev),
   }), [isDark])

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
   return useContext(ThemeContext)
}
