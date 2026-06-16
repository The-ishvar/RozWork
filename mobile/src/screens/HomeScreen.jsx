import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function HomeScreen() {
   const navigation = useNavigation()
   const { user } = useAuth()
   const { t } = useLanguage()
   const { theme } = useTheme()
   const [jobs, setJobs] = useState([])
   const [workers, setWorkers] = useState([])
   const [notifications, setNotifications] = useState([])
   const [loading, setLoading] = useState(true)

   const loadData = async () => {
      try {
         setLoading(true)
         const [jobsResponse, workersResponse, notificationsResponse] = await Promise.all([
            apiClient.get('/jobs'),
            apiClient.get('/workers'),
            apiClient.get('/notifications'),
         ])

         setJobs(jobsResponse.data.jobs || [])
         setWorkers(workersResponse.data.workers || [])
         setNotifications(notificationsResponse.data.notifications || [])
      } catch (error) {
         Alert.alert('Unable to load dashboard', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadData()
      const timer = setInterval(loadData, 15000)
      return () => clearInterval(timer)
   }, [])

   const handleApply = async (jobId) => {
      try {
         await apiClient.post(`/jobs/${jobId}/apply`)
         Alert.alert('Applied', 'Your application has been submitted successfully.')
      } catch (error) {
         Alert.alert('Application failed', error?.response?.data?.message || 'Please try again later.')
      }
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View>
               <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('home.heroEyebrow', 'RozWork mobile')}</Text>
               <Text style={[styles.title, { color: theme.text }]}>{t('home.heroTitle', 'Hello')} {user?.name || t('home.heroGreetingFallback', 'there')}</Text>
               <Text style={[styles.subtitle, { color: theme.muted }]}>{t('home.heroSubtitle', 'Your secure, mobile-first workspace for jobs, bookings, and growth.')}</Text>
            </View>
            <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('Search')}>
               <Text style={styles.buttonText}>{t('home.browseNow', 'Browse now')}</Text>
            </Pressable>
         </View>

         <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.statValue, { color: theme.text }]}>{jobs.length}</Text>
               <Text style={[styles.statLabel, { color: theme.muted }]}>{t('home.openJobs', 'Open jobs')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.statValue, { color: theme.text }]}>{notifications.length}</Text>
               <Text style={[styles.statLabel, { color: theme.muted }]}>{t('home.alerts', 'Alerts')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.statValue, { color: theme.text }]}>{workers.length}</Text>
               <Text style={[styles.statLabel, { color: theme.muted }]}>{t('home.workers', 'Workers')}</Text>
            </View>
         </View>

         <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.rowBetween}>
               <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.featuredOpportunities', 'Featured opportunities')}</Text>
               <Pressable onPress={() => navigation.navigate('Jobs')}>
                  <Text style={{ color: theme.primary }}>{t('home.viewAll', 'View all')}</Text>
               </Pressable>
            </View>
            {loading ? <ActivityIndicator style={{ marginTop: 12 }} color={theme.primary} /> : jobs.slice(0, 3).map((job) => (
               <View key={job.id} style={[styles.listItem, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.itemTitle, { color: theme.text }]}>{job.title}</Text>
                     <Text style={[styles.itemMeta, { color: theme.muted }]}>{job.category} • {job.location}</Text>
                  </View>
                  <Pressable style={[styles.smallButton, { backgroundColor: theme.primary }]} onPress={() => handleApply(job.id)}>
                     <Text style={styles.buttonText}>{t('home.apply', 'Apply')}</Text>
                  </Pressable>
               </View>
            ))}
         </View>

         <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.rowBetween}>
               <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.topProfessionals', 'Top professionals')}</Text>
               <Pressable onPress={() => navigation.navigate('Search')}>
                  <Text style={{ color: theme.primary }}>{t('home.search', 'Search')}</Text>
               </Pressable>
            </View>
            {workers.slice(0, 3).map((worker) => (
               <View key={worker.id} style={[styles.listItem, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.itemTitle, { color: theme.text }]}>{worker.name}</Text>
                     <Text style={[styles.itemMeta, { color: theme.muted }]}>{worker.profession} • {worker.location}</Text>
                  </View>
                  <Pressable style={[styles.smallButton, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Booking', { worker, serviceTitle: worker.profession, amount: worker.price })}>
                     <Text style={styles.buttonText}>{t('home.book', 'Book')}</Text>
                  </Pressable>
               </View>
            ))}
         </View>
      </ScrollView>
   )
}

const styles = StyleSheet.create({
   container: {
      padding: 20,
      gap: 16,
      paddingBottom: 48,
   },
   heroCard: {
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
   },
   eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
   },
   title: {
      fontSize: 24,
      fontWeight: '700',
   },
   subtitle: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
   },
   primaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 999,
      alignSelf: 'flex-start',
   },
   buttonText: {
      color: '#fff',
      fontWeight: '700',
   },
   statsRow: {
      flexDirection: 'row',
      gap: 10,
   },
   statCard: {
      flex: 1,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
   },
   statValue: {
      fontSize: 20,
      fontWeight: '700',
   },
   statLabel: {
      fontSize: 12,
      marginTop: 4,
   },
   sectionCard: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
   },
   rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
   },
   listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderTopWidth: 1,
   },
   itemTitle: {
      fontWeight: '600',
   },
   itemMeta: {
      marginTop: 4,
      fontSize: 12,
   },
   smallButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
   },
})
