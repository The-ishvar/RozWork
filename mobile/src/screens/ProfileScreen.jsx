import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function ProfileScreen() {
   const navigation = useNavigation()
   const { user, logout } = useAuth()
   const { theme } = useTheme()

   const handleLogout = async () => {
      await logout()
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{user?.name || 'RozWork user'}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{user?.profession || 'Professional'} • {user?.role || 'user'}</Text>
            <Text style={[styles.meta, { color: theme.primary }]}>{user?.email || 'No email available'}</Text>
         </View>

         <View style={[styles.grid, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable style={styles.tile} onPress={() => navigation.navigate('Wallet')}>
               <Text style={[styles.tileTitle, { color: theme.text }]}>Wallet</Text>
               <Text style={[styles.tileValue, { color: theme.primary }]}>View transactions</Text>
            </Pressable>
            <Pressable style={styles.tile} onPress={() => navigation.navigate('Settings')}>
               <Text style={[styles.tileTitle, { color: theme.text }]}>Settings</Text>
               <Text style={[styles.tileValue, { color: theme.primary }]}>Theme and security</Text>
            </Pressable>
         </View>

         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile overview</Text>
            <Text style={[styles.item, { color: theme.muted }]}>Phone: {user?.phone || '—'}</Text>
            <Text style={[styles.item, { color: theme.muted }]}>Location: {user?.location || '—'}</Text>
            <Text style={[styles.item, { color: theme.muted }]}>Verified: {user?.isVerified ? 'Yes' : 'Pending'}</Text>
         </View>

         <Pressable style={[styles.logoutButton, { backgroundColor: theme.danger }]} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
         </Pressable>
      </ScrollView>
   )
}

const styles = StyleSheet.create({
   container: {
      padding: 20,
      paddingBottom: 48,
      gap: 16,
   },
   heroCard: {
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
   },
   title: {
      fontSize: 24,
      fontWeight: '700',
   },
   subtitle: {
      marginTop: 6,
      fontSize: 14,
   },
   meta: {
      marginTop: 8,
      fontWeight: '600',
   },
   grid: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
   },
   tile: {
      flex: 1,
      padding: 14,
      borderRadius: 16,
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
   },
   tileTitle: {
      fontSize: 15,
      fontWeight: '700',
   },
   tileValue: {
      marginTop: 4,
      fontSize: 12,
   },
   card: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
   },
   sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
   },
   item: {
      fontSize: 13,
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
