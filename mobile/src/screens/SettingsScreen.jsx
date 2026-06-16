import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function SettingsScreen() {
   const { theme, toggleTheme, isDark } = useTheme()
   const { logout } = useAuth()
   const { t, language, toggleLanguage } = useLanguage()

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>{t('settings.title', 'Settings')}</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>{t('settings.subtitle', 'Configure your app experience and security preferences.')}</Text>

         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('settings.appearance', 'Appearance')}</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={toggleTheme}>
               <Text style={styles.buttonText}>{isDark ? t('settings.switchToLightMode', 'Switch to light mode') : t('settings.switchToDarkMode', 'Switch to dark mode')}</Text>
            </Pressable>
         </View>

         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('settings.security', 'Security')}</Text>
            <Text style={[styles.item, { color: theme.muted }]}>{t('settings.securityDescription', 'JWT authentication, protected routes, and secure token storage are active.')}</Text>
         </View>

         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('settings.language', 'Language')}</Text>
            <Text style={[styles.item, { color: theme.muted }]}>{t('settings.currentLanguage', 'Current language')}: {language.toUpperCase()}</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={toggleLanguage}>
               <Text style={styles.buttonText}>{t('settings.switchLanguage', 'Switch language')}</Text>
            </Pressable>
         </View>

         <Pressable style={[styles.logoutButton, { backgroundColor: theme.danger }]} onPress={() => logout()}>
            <Text style={styles.logoutText}>{t('settings.logout', 'Logout')}</Text>
}

            const styles = StyleSheet.create({
               container: {
               padding: 20,
            paddingBottom: 48,
            gap: 12,
   },
            title: {
               fontSize: 22,
            fontWeight: '700',
   },
            subtitle: {
               marginBottom: 8,
   },
            card: {
               padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            gap: 12,
   },
            cardTitle: {
               fontSize: 16,
            fontWeight: '700',
   },
            item: {
               fontSize: 13,
            lineHeight: 20,
   },
            button: {
               paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 999,
            alignSelf: 'flex-start',
   },
            buttonText: {
               color: '#fff',
            fontWeight: '700',
   },
            logoutButton: {
               paddingVertical: 14,
            borderRadius: 999,
            alignItems: 'center',
   },
            logoutText: {
               color: '#fff',
            fontWeight: '700',
   },
})
