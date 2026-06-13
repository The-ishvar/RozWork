import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function WalletScreen() {
   const { theme } = useTheme()
   const [purchases, setPurchases] = useState([])
   const [loading, setLoading] = useState(true)

   const loadPurchases = async () => {
      try {
         setLoading(true)
         const { data } = await apiClient.get('/purchases')
         setPurchases(data.purchases || [])
      } catch (error) {
         Alert.alert('Wallet unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadPurchases()
   }, [])

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>Wallet</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>Track your payments, transactions, and completed bookings.</Text>

         {loading ? <ActivityIndicator style={{ marginTop: 16 }} color={theme.primary} /> : purchases.map((purchase) => (
            <View key={purchase.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.cardTitle, { color: theme.text }]}>{purchase.service || purchase.workerName}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>Status: {purchase.status}</Text>
               <Text style={[styles.amount, { color: theme.primary }]}>₹{purchase.amount}</Text>
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
      gap: 8,
   },
   cardTitle: {
      fontSize: 16,
      fontWeight: '700',
   },
   cardMeta: {
      fontSize: 13,
   },
   amount: {
      fontSize: 15,
      fontWeight: '700',
   },
})
