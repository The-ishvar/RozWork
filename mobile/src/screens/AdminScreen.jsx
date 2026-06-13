import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../api/client'

export default function AdminScreen() {
   const { theme } = useTheme()
   const [stats, setStats] = useState(null)
   const [users, setUsers] = useState([])
   const [loading, setLoading] = useState(true)

   const loadAdminData = async () => {
      try {
         setLoading(true)
         const [statsResponse, usersResponse] = await Promise.all([
            apiClient.get('/admin/stats'),
            apiClient.get('/admin/users'),
         ])
         setStats(statsResponse.data.stats)
         setUsers(usersResponse.data.users || [])
      } catch (error) {
         Alert.alert('Admin data unavailable', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadAdminData()
   }, [])

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <Text style={[styles.title, { color: theme.text }]}>Mobile admin console</Text>
         <Text style={[styles.subtitle, { color: theme.muted }]}>Monitor users, jobs, bookings, revenue, and platform health inside the app.</Text>

         {loading ? <ActivityIndicator style={{ marginTop: 16 }} color={theme.primary} /> : (
            <>
               <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                     <Text style={[styles.statValue, { color: theme.text }]}>{stats?.totalUsers || 0}</Text>
                     <Text style={[styles.statLabel, { color: theme.muted }]}>Users</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                     <Text style={[styles.statValue, { color: theme.text }]}>{stats?.totalJobs || 0}</Text>
                     <Text style={[styles.statLabel, { color: theme.muted }]}>Jobs</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                     <Text style={[styles.statValue, { color: theme.text }]}>{stats?.totalBookings || 0}</Text>
                     <Text style={[styles.statLabel, { color: theme.muted }]}>Bookings</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                     <Text style={[styles.statValue, { color: theme.text }]}>₹{stats?.totalRevenue || 0}</Text>
                     <Text style={[styles.statLabel, { color: theme.muted }]}>Revenue</Text>
                  </View>
               </View>

               <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Recent accounts</Text>
                  {users.slice(0, 6).map((user) => (
                     <View key={user.id} style={[styles.row, { borderTopColor: theme.border }]}>
                        <Text style={[styles.rowText, { color: theme.text }]}>{user.name}</Text>
                        <Text style={[styles.rowMeta, { color: theme.muted }]}>{user.role}</Text>
                     </View>
                  ))}
               </View>
            </>
         )}
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
   statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
   },
   statCard: {
      width: '48%',
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
   },
   statValue: {
      fontSize: 18,
      fontWeight: '700',
   },
   statLabel: {
      fontSize: 12,
      marginTop: 4,
   },
   card: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      gap: 10,
   },
   cardTitle: {
      fontSize: 16,
      fontWeight: '700',
   },
   row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
   },
   rowText: {
      fontSize: 13,
      fontWeight: '600',
   },
   rowMeta: {
      fontSize: 12,
   },
})
