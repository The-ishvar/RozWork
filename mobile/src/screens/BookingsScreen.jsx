import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function BookingsScreen() {
   const { theme } = useTheme()
   const [bookings, setBookings] = useState([])
   const [loading, setLoading] = useState(true)

   const loadBookings = async () => {
      try {
         setLoading(true)
         const { data } = await apiClient.get('/bookings')
         setBookings(data.bookings || [])
      } catch (error) {
         Alert.alert('Bookings unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadBookings()
   }, [])

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>My bookings</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>All bookings are stored in your MongoDB-backed RozWork records.</Text>

         {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.primary} /> : bookings.map((booking) => (
            <View key={booking.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.cardTitle, { color: theme.text }]}>{booking.serviceTitle}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>Provider: {booking.serviceProvider || 'RozWork partner'}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>Amount: ₹{booking.amount}</Text>
               <Text style={[styles.cardMeta, { color: theme.primary }]}>Status: {booking.status}</Text>
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
   },
})
