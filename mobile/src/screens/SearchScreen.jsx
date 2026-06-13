import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function SearchScreen() {
   const navigation = useNavigation()
   const { theme } = useTheme()
   const [query, setQuery] = useState('')
   const [activeTab, setActiveTab] = useState('workers')
   const [workers, setWorkers] = useState([])
   const [jobs, setJobs] = useState([])
   const [loading, setLoading] = useState(true)

   const loadData = async () => {
      try {
         setLoading(true)
         const [workersResponse, jobsResponse] = await Promise.all([
            apiClient.get('/workers'),
            apiClient.get('/jobs'),
         ])
         setWorkers(workersResponse.data.workers || [])
         setJobs(jobsResponse.data.jobs || [])
      } catch (error) {
         Alert.alert('Search unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadData()
   }, [])

   const results = useMemo(() => {
      const normalized = query.trim().toLowerCase()
      const filterItems = (items) => items.filter((item) => !normalized || [item.name, item.title, item.profession, item.category, item.location, item.description].join(' ').toLowerCase().includes(normalized))

      if (activeTab === 'jobs') {
         return filterItems(jobs)
      }

      return filterItems(workers)
   }, [activeTab, jobs, query, workers])

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>Search workers and jobs</Text>
         <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Search by role, skill, city, or job title"
            placeholderTextColor={theme.muted}
            value={query}
            onChangeText={setQuery}
         />

         <View style={styles.tabs}>
            <Pressable style={[styles.tab, activeTab === 'workers' && styles.activeTab, { borderColor: theme.border }]} onPress={() => setActiveTab('workers')}>
               <Text style={{ color: activeTab === 'workers' ? theme.primary : theme.muted }}>Workers</Text>
            </Pressable>
            <Pressable style={[styles.tab, activeTab === 'jobs' && styles.activeTab, { borderColor: theme.border }]} onPress={() => setActiveTab('jobs')}>
               <Text style={{ color: activeTab === 'jobs' ? theme.primary : theme.muted }}>Jobs</Text>
            </Pressable>
         </View>

         {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.primary} /> : results.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.cardTitle, { color: theme.text }]}>{activeTab === 'jobs' ? item.title : item.name}</Text>
               <Text style={[styles.cardMeta, { color: theme.muted }]}>{activeTab === 'jobs' ? `${item.category} • ${item.location}` : `${item.profession} • ${item.location}`}</Text>
               <Text style={[styles.cardBody, { color: theme.text }]}>{activeTab === 'jobs' ? item.description : item.bio}</Text>
               <View style={styles.actions}>
                  {activeTab === 'jobs' ? (
                     <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => Alert.alert('Application ready', 'Use the Home screen quick action to apply to this opportunity.')}>
                        <Text style={styles.buttonText}>Apply</Text>
                     </Pressable>
                  ) : (
                     <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Booking', { worker: item, serviceTitle: item.profession, amount: item.price })}>
                        <Text style={styles.buttonText}>Book</Text>
                     </Pressable>
                  )}
               </View>
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
   input: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
   },
   tabs: {
      flexDirection: 'row',
      gap: 10,
   },
   tab: {
      flex: 1,
      paddingVertical: 10,
      borderWidth: 1,
      borderRadius: 999,
      alignItems: 'center',
   },
   activeTab: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
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
   actions: {
      marginTop: 6,
   },
   button: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      alignSelf: 'flex-start',
   },
   buttonText: {
      color: '#fff',
      fontWeight: '700',
   },
})
