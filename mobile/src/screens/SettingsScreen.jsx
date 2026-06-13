import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function SettingsScreen() {
   const { theme, toggleTheme, isDark } = useTheme()
   const { logout } = useAuth()

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>Configure your app experience and security preferences.</Text>

         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Appearance</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={toggleTheme}>
               <Text style={styles.buttonText}>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</Text>
            </Pressable>
         </View>

         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Security</Text>
            <Text style={[styles.item, { color: theme.muted }]}>JWT authentication, protected routes, and secure token storage are active.</Text>
         </View>

         <Pressable style={[styles.logoutButton, { backgroundColor: theme.danger }]} onPress={() => logout()}>
            <Text style={styles.logoutText}>Logout</Text>
         </Pressable>
      </ScrollView>
   )
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
