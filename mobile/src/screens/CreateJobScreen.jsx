import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function CreateJobScreen() {
   const navigation = useNavigation()
   const { theme } = useTheme()
   const [title, setTitle] = useState('')
   const [category, setCategory] = useState('')
   const [location, setLocation] = useState('')
   const [salary, setSalary] = useState('')
   const [description, setDescription] = useState('')
   const [loading, setLoading] = useState(false)

   const handleSubmit = async () => {
      try {
         setLoading(true)
         await apiClient.post('/jobs/create', { title, category, location, salary, description })
         Alert.alert('Job posted', 'Your opportunity is now live in RozWork.')
         navigation.goBack()
      } catch (error) {
         Alert.alert('Unable to create job', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Create a job</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Job title" placeholderTextColor={theme.muted} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Category" placeholderTextColor={theme.muted} value={category} onChangeText={setCategory} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Location" placeholderTextColor={theme.muted} value={location} onChangeText={setLocation} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Salary" placeholderTextColor={theme.muted} value={salary} onChangeText={setSalary} />
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, minHeight: 120 }]} placeholder="Description" placeholderTextColor={theme.muted} multiline value={description} onChangeText={setDescription} />

            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
               <Text style={styles.buttonText}>{loading ? 'Posting...' : 'Publish job'}</Text>
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
      marginBottom: 16,
   },
   input: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
   },
   button: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
   },
   buttonText: {
      color: '#fff',
      fontWeight: '700',
   },
})
