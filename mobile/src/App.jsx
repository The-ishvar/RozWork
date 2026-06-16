import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import AppNavigator from './navigation/AppNavigator'

export default function App() {
   return (
      <ThemeProvider>
         <LanguageProvider>
            <AuthProvider>
               <StatusBar style="auto" />
               <AppNavigator />
            </AuthProvider>
         </LanguageProvider>
      </ThemeProvider>
   )
}
