import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function NotificationsScreen() {
   const { theme } = useTheme()
   const [notifications, setNotifications] = useState([])
   const [loading, setLoading] = useState(true)

   const loadNotifications = async () => {
      try {
         setLoading(true)
         const { data } = await apiClient.get('/notifications')
         setNotifications(data.notifications || [])
      } catch (error) {
         Alert.alert('Notifications unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadNotifications()
      const timer = setInterval(loadNotifications, 15000)
      return () => clearInterval(timer)
   }, [])

   const markRead = async (notificationId) => {
      try {
         await apiClient.patch(`/notifications/${notificationId}/read`)
         setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, isRead: true } : item))
      } catch (error) {
         Alert.alert('Unable to mark read', error?.response?.data?.message || 'Please retry.')
      }
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>Real-time updates from your booking and application activity.</Text>

         {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.primary} /> : notifications.map((notification) => (
            <Pressable key={notification.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => markRead(notification.id)}>
               <Text style={[styles.cardTitle, { color: theme.text }]}>{notification.title}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>{notification.message}</Text>
               <Text style={[styles.status, { color: notification.isRead ? theme.muted : theme.primary }]}> {notification.isRead ? 'Read' : 'New'} </Text>
            </Pressable>
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
   status: {
      fontSize: 12,
      fontWeight: '700',
   },
})
