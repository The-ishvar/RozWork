import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import SplashScreen from '../screens/SplashScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import AuthScreen from '../screens/AuthScreen'
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'
import HomeScreen from '../screens/HomeScreen'
import SearchScreen from '../screens/SearchScreen'
import BookingsScreen from '../screens/BookingsScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import MessagesScreen from '../screens/MessagesScreen'
import ProfileScreen from '../screens/ProfileScreen'
import JobsScreen from '../screens/JobsScreen'
import CreateJobScreen from '../screens/CreateJobScreen'
import BookingScreen from '../screens/BookingScreen'
import WalletScreen from '../screens/WalletScreen'
import SettingsScreen from '../screens/SettingsScreen'
import AdminScreen from '../screens/AdminScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
   const { user } = useAuth()
   const { theme } = useTheme()
   const { t } = useLanguage()
   const isAdmin = ['admin', 'super_admin'].includes(user?.role)

   const tabLabels = {
      Home: t('nav.home', 'Home'),
      Search: t('nav.search', 'Search'),
      Jobs: t('nav.jobs', 'Jobs'),
      Bookings: t('nav.bookings', 'Bookings'),
      Notifications: t('nav.notifications', 'Notifications'),
      Messages: t('nav.messages', 'Messages'),
      Profile: t('nav.profile', 'Profile'),
      Admin: t('nav.admin', 'Admin'),
   }

   return (
      <Tab.Navigator
         screenOptions={({ route }) => ({
            headerShown: false,
            tabBarLabel: tabLabels[route.name] || route.name,
            tabBarIcon: ({ color, size }) => {
               const iconName = {
                  Home: 'home-outline',
                  Search: 'search-outline',
                  Jobs: 'briefcase-outline',
                  Bookings: 'calendar-outline',
                  Notifications: 'notifications-outline',
                  Messages: 'chatbubble-outline',
                  Profile: 'person-outline',
                  Admin: 'shield-outline',
               }[route.name] || 'ellipse-outline'
               return <Ionicons name={iconName} size={size} color={color} />
            },
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.muted,
            tabBarStyle: {
               backgroundColor: theme.surface,
               borderTopColor: theme.border,
            },
         })}
      >
         <Tab.Screen name="Home" component={HomeScreen} />
         <Tab.Screen name="Search" component={SearchScreen} />
         <Tab.Screen name="Jobs" component={JobsScreen} />
         <Tab.Screen name="Bookings" component={BookingsScreen} />
         <Tab.Screen name="Notifications" component={NotificationsScreen} />
         <Tab.Screen name="Messages" component={MessagesScreen} />
         <Tab.Screen name="Profile" component={ProfileScreen} />
         {isAdmin ? <Tab.Screen name="Admin" component={AdminScreen} /> : null}
      </Tab.Navigator>
   )
}

export default function AppNavigator() {
   const { loading, user, hasSeenOnboarding, completeOnboarding } = useAuth()
   const { isDark } = useTheme()

   if (loading) {
      return <SplashScreen />
   }

   return (
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
         <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
               !hasSeenOnboarding ? (
                  <Stack.Screen name="Onboarding" children={(props) => <OnboardingScreen {...props} onFinish={completeOnboarding} />} />
               ) : (
                  <>
                     <Stack.Screen name="Auth" component={AuthScreen} />
                     <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                  </>
               )
            ) : (
               <>
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                  <Stack.Screen name="CreateJob" component={CreateJobScreen} />
                  <Stack.Screen name="Booking" component={BookingScreen} />
                  <Stack.Screen name="Wallet" component={WalletScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                  <Stack.Screen name="Admin" component={AdminScreen} />
               </>
            )}
         </Stack.Navigator>
      </NavigationContainer>
   )
}
