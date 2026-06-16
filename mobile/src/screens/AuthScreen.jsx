import React, { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

export default function AuthScreen() {
   const navigation = useNavigation()
   const { login, register } = useAuth()
   const { t } = useLanguage()
   const { theme } = useTheme()
   const [mode, setMode] = useState('login')
   const [name, setName] = useState('')
   const [email, setEmail] = useState('')
   const [phone, setPhone] = useState('')
   const [password, setPassword] = useState('')
   const [loading, setLoading] = useState(false)

   const isLogin = mode === 'login'

   const title = useMemo(
      () => (isLogin ? t('auth.welcomeBack', 'Welcome back') : t('auth.createAccount', 'Create your account')),
      [isLogin, t]
   )
   const subtitle = useMemo(
      () => (isLogin ? t('auth.securelyAccess', 'Securely access RozWork from your mobile device.') : t('auth.joinMillions', 'Join millions of workers, employers, and service seekers.')),
      [isLogin, t]
   )

   const handleSubmit = async () => {
      try {
         setLoading(true)
         if (isLogin) {
            await login(email || phone, password)
         } else {
            await register({ name, email, phone, password, role: 'user' })
         }
      } catch (error) {
         Alert.alert('Authentication failed', error?.response?.data?.message || 'Please try again.')
      } finally {
         setLoading(false)
      }
   }

   return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>

            <View style={styles.switchRow}>
               <Pressable style={[styles.switchButton, !isLogin && styles.switchActive, { borderColor: theme.border }]} onPress={() => setMode('login')}>
                  <Text style={[styles.switchText, { color: isLogin ? theme.primary : theme.muted }]}>{t('auth.login', 'Login')}</Text>
               </Pressable>
               <Pressable style={[styles.switchButton, isLogin && styles.switchActive, { borderColor: theme.border }]} onPress={() => setMode('register')}>
                  <Text style={[styles.switchText, { color: !isLogin ? theme.primary : theme.muted }]}>{t('auth.register', 'Register')}</Text>
               </Pressable>
            </View>

            {!isLogin ? (
               <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder={t('auth.fullName', 'Full name')}
                  placeholderTextColor={theme.muted}
                  value={name}
                  onChangeText={setName}
               />
            ) : null}

            <TextInput
               style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
               placeholder={t('auth.emailOrPhone', 'Email or phone')}
               placeholderTextColor={theme.muted}
               autoCapitalize="none"
               value={email || phone}
               onChangeText={(value) => {
                  setEmail(value)
                  setPhone(value)
               }}
            />

            {!isLogin ? (
               <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder={t('auth.phone', 'Phone')}
                  placeholderTextColor={theme.muted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
               />
            ) : null}

            <TextInput
               style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
               placeholder={t('auth.password', 'Password')}
               placeholderTextColor={theme.muted}
               secureTextEntry
               value={password}
               onChangeText={setPassword}
            />

            <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
               <Text style={styles.buttonText}>{loading ? t('auth.pleaseWait', 'Please wait...') : isLogin ? t('auth.login', 'Login') : t('auth.register', 'Register')}</Text>
            </Pressable>

            {isLogin ? (
               <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={[styles.linkText, { color: theme.primary }]}>{t('auth.forgotPassword', 'Forgot password?')}</Text>
               </Pressable>
            ) : null}
         </View>
      </ScrollView>
   )
}

const styles = StyleSheet.create({
   container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
   },
   card: {
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
   },
   title: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 24,
   },
   switchRow: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 8,
   },
   switchButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
   },
   switchActive: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
   },
   switchText: {
      fontWeight: '600',
   },
   input: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
   },
   primaryButton: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
   },
   buttonText: {
      color: '#ffffff',
      fontWeight: '700',
   },
   linkText: {
      marginTop: 14,
      textAlign: 'center',
      fontWeight: '600',
   },
})
