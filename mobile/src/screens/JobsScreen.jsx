import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function JobsScreen() {
   const navigation = useNavigation()
   const { user } = useAuth()
   const { theme } = useTheme()
   const [jobs, setJobs] = useState([])
   const [loading, setLoading] = useState(true)

   const loadJobs = async () => {
      try {
         setLoading(true)
         const { data } = await apiClient.get('/jobs')
         setJobs(data.jobs || [])
      } catch (error) {
         Alert.alert('Jobs unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadJobs()
   }, [])

   const handleApply = async (jobId) => {
      try {
         await apiClient.post(`/jobs/${jobId}/apply`)
         Alert.alert('Applied', 'Your application was recorded successfully.')
      } catch (error) {
         Alert.alert('Application failed', error?.response?.data?.message || 'Please try again later.')
      }
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
               <Text style={[styles.title, { color: theme.text }]}>Open jobs</Text>
               <Text style={[styles.subtitle, { color: theme.muted }]}>Post, discover, and apply to real opportunities from the RozWork backend.</Text>
            </View>
            {['employer', 'admin', 'super_admin'].includes(user?.role) ? (
               <Pressable style={[styles.createButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('CreateJob')}>
                  <Text style={styles.createButtonText}>Post</Text>
               </Pressable>
            ) : null}
         </View>

         {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.primary} /> : jobs.map((job) => (
            <View key={job.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.cardTitle, { color: theme.text }]}>{job.title}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>{job.category} • {job.location}</Text>
               <Text style={[styles.cardBody, { color: theme.text }]}>{job.description}</Text>
               <Text style={[styles.cardMeta, { color: theme.primary }]}>Salary: {job.salary}</Text>
               <Pressable style={[styles.applyButton, { backgroundColor: theme.primary }]} onPress={() => handleApply(job.id)}>
                  <Text style={styles.applyButtonText}>Apply now</Text>
               </Pressable>
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
   headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
   },
   title: {
      fontSize: 22,
      fontWeight: '700',
   },
   subtitle: {
      marginTop: 4,
      fontSize: 13,
   },
   createButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
   },
   createButtonText: {
      color: '#fff',
      fontWeight: '700',
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
   cardBody: {
      fontSize: 14,
      lineHeight: 20,
   },
   applyButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      alignSelf: 'flex-start',
   },
   applyButtonText: {
      color: '#fff',
      fontWeight: '700',
   },
})
