import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function MessagesScreen() {
   const { theme } = useTheme()
   const [messages, setMessages] = useState([])
   const [loading, setLoading] = useState(true)

   const loadMessages = async () => {
      try {
         setLoading(true)
         const { data } = await apiClient.get('/notifications')
         setMessages((data.notifications || []).slice(0, 8))
      } catch (error) {
         Alert.alert('Messages unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadMessages()
   }, [])

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>A dedicated communication view for application updates and booking conversations.</Text>

         {loading ? <ActivityIndicator style={{ marginTop: 16 }} color={theme.primary} /> : messages.map((message) => (
            <View key={message.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.cardTitle, { color: theme.text }]}>{message.title}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>{message.message}</Text>
            </View>
         ))}
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
      gap: 6,
   },
   cardTitle: {
      fontSize: 16,
      fontWeight: '700',
   },
   cardMeta: {
      fontSize: 13,
      lineHeight: 20,
   },
})
