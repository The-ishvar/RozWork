import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function BookingScreen() {
   const navigation = useNavigation()
   const route = useRoute()
   const { theme } = useTheme()
   const [contactName, setContactName] = useState('')
   const [contactEmail, setContactEmail] = useState('')
   const [contactPhone, setContactPhone] = useState('')
   const [note, setNote] = useState('')
   const [loading, setLoading] = useState(false)
   const worker = route.params?.worker
   const serviceTitle = route.params?.serviceTitle || 'Professional service'
   const amount = route.params?.amount || 500

   const handleSubmit = async () => {
      try {
         setLoading(true)
         await apiClient.post('/purchases', {
            workerName: worker?.name || serviceTitle,
            workerProfession: worker?.profession || serviceTitle,
            amount,
            service: serviceTitle,
            providerId: worker?.id || null,
            note,
            reference: `mobile_${Date.now()}`,
         })
         Alert.alert('Booking confirmed', 'Your payment and booking have been recorded in MongoDB.')
         navigation.goBack()
      } catch (error) {
         Alert.alert('Booking failed', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Book {serviceTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Securely complete the payment flow and persist the booking to MongoDB.</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Your name" placeholderTextColor={theme.muted} value={contactName} onChangeText={setContactName} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Email" placeholderTextColor={theme.muted} value={contactEmail} onChangeText={setContactEmail} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Phone" placeholderTextColor={theme.muted} value={contactPhone} onChangeText={setContactPhone} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, minHeight: 100 }]} placeholder="Add a note" placeholderTextColor={theme.muted} multiline value={note} onChangeText={setNote} />
            <Text style={[styles.amount, { color: theme.primary }]}>Amount: ₹{amount}</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
               <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Pay with UPI'}</Text>
            </Pressable>
         </View>
      </ScrollView>
   )
}

const styles = StyleSheet.create({
   container: {
      flexGrow: 1,
      padding: 20,
      justifyContent: 'center',
   },
   card: {
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
   },
   title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 6,
   },
   subtitle: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
   },
   input: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
   },
   amount: {
      marginBottom: 12,
      fontWeight: '700',
   },
   button: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
   },
   buttonText: {
      color: '#fff',
      fontWeight: '700',
   },
})
