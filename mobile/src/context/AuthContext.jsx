import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import apiClient from '../api/client'

const AuthContext = createContext(null)
const TOKEN_KEY = 'rozwork_token'
const USER_KEY = 'rozwork_user'
const ONBOARDING_KEY = 'rozwork_onboarding'

export function AuthProvider({ children }) {
   const [user, setUser] = useState(null)
   const [token, setToken] = useState(null)
   const [loading, setLoading] = useState(true)
   const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
   const [otpPhone, setOtpPhone] = useState('')

   const persistSession = async (nextToken, nextUser) => {
      if (nextToken) {
         await SecureStore.setItemAsync(TOKEN_KEY, nextToken)
      } else {
         await SecureStore.deleteItemAsync(TOKEN_KEY)
      }

      if (nextUser) {
         await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser))
      } else {
         await SecureStore.deleteItemAsync(USER_KEY)
      }
   }

   const bootstrapAuth = async () => {
      try {
         const [savedToken, savedUser, onboardingState] = await Promise.all([
            SecureStore.getItemAsync(TOKEN_KEY),
            SecureStore.getItemAsync(USER_KEY),
            SecureStore.getItemAsync(ONBOARDING_KEY),
         ])

         setHasSeenOnboarding(onboardingState === 'true')
         if (!savedToken) {
            return
         }

         setToken(savedToken)
         if (savedUser) {
            setUser(JSON.parse(savedUser))
         }

         const { data } = await apiClient.get('/auth/me')
         setUser(data.user)
         await persistSession(savedToken, data.user)
      } catch (_error) {
         await persistSession(null, null)
         setToken(null)
         setUser(null)
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      bootstrapAuth()
   }, [])

   const login = async (identifier, password) => {
      const { data } = await apiClient.post('/auth/login', { identifier, password })
      setToken(data.token)
      setUser(data.user)
      await persistSession(data.token, data.user)
      return data
   }

   const register = async (payload) => {
      const { data } = await apiClient.post('/auth/register', payload)
      setToken(data.token)
      setUser(data.user)
      await persistSession(data.token, data.user)
      return data
   }

   const forgotPassword = async (phone) => {
      const { data } = await apiClient.post('/auth/forgot-password', { phone })
      setOtpPhone(phone)
      return data
   }

   const verifyOtp = async (phone, otp) => {
      const { data } = await apiClient.post('/auth/verify-otp', { phone, otp })
      return data
   }

   const resetPassword = async (phone, otp, password) => {
      const { data } = await apiClient.post('/auth/reset-password', { phone, otp, password })
      return data
   }

   const completeOnboarding = async () => {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true')
      setHasSeenOnboarding(true)
   }

   const logout = async () => {
      await persistSession(null, null)
      setToken(null)
      setUser(null)
   }

   const value = useMemo(() => ({
      user,
      token,
      loading,
      hasSeenOnboarding,
      otpPhone,
      setOtpPhone,
      login,
      register,
      forgotPassword,
      verifyOtp,
      resetPassword,
      completeOnboarding,
      logout,
   }), [user, token, loading, hasSeenOnboarding, otpPhone])

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
   return useContext(AuthContext)
}
