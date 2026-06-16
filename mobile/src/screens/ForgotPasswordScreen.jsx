import React, { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

export default function ForgotPasswordScreen() {
   const navigation = useNavigation()
   const { forgotPassword, verifyOtp, resetPassword, otpPhone, setOtpPhone } = useAuth()
   const { t } = useLanguage()
   const { theme } = useTheme()
   const [step, setStep] = useState('request')
   const [phone, setPhone] = useState(otpPhone)
   const [otp, setOtp] = useState('')
   const [password, setPassword] = useState('')
   const [loading, setLoading] = useState(false)

   const requestOtp = async () => {
      try {
         setLoading(true)
         await forgotPassword(phone)
         setStep('verify')
         Alert.alert('OTP sent', 'Check your phone and enter the code shown by the backend.')
      } catch (error) {
         Alert.alert('Unable to send OTP', error?.response?.data?.message || 'Please try again later.')
      } finally {
         setLoading(false)
      }
   }

   const verifyAndReset = async () => {
      try {
         setLoading(true)
         await verifyOtp(phone, otp)
         await resetPassword(phone, otp, password)
         Alert.alert('Password reset', 'You can now sign in with your new password.')
         navigation.goBack()
      } catch (error) {
         Alert.alert('Reset failed', error?.response?.data?.message || 'Please try again.')
      } finally {
         setLoading(false)
      }
   }

   return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
         <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{t('forgotPassword.title', 'Recover your password')}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t('forgotPassword.subtitle', 'Use the mobile OTP flow connected to the existing RozWork auth APIs.')}</Text>
            {step === 'request' ? (
               <>
                  <TextInput
                     style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                     placeholder={t('forgotPassword.phoneNumber', 'Phone number')}
                     placeholderTextColor={theme.muted}
                     value={phone}
                     onChangeText={(value) => {
                        setPhone(value)
                        setOtpPhone(value)
                     }}
                     keyboardType="phone-pad"
                  />
                  <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={requestOtp} disabled={loading}>
                     <Text style={styles.buttonText}>{loading ? t('auth.pleaseWait', 'Please wait...') : t('forgotPassword.sendOtp', 'Send OTP')}</Text>
                  </Pressable>
               </>
            ) : (
               <>
                  <TextInput
                     style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                     placeholder={t('forgotPassword.otp', 'OTP')}
                     placeholderTextColor={theme.muted}
                     value={otp}
                     onChangeText={setOtp}
                     keyboardType="number-pad"
                  />
                  <TextInput
                     style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                     placeholder={t('forgotPassword.newPassword', 'New password')}
                     placeholderTextColor={theme.muted}
                     value={password}
                     secureTextEntry
                     onChangeText={setPassword}
                  />
                  <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={verifyAndReset} disabled={loading}>
                     <Text style={styles.buttonText}>{loading ? t('forgotPassword.working', 'Working...') : t('forgotPassword.resetPassword', 'Reset password')}</Text>
                  </Pressable>
               </>
            )}

            <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
               <Text style={[styles.linkText, { color: theme.primary }]}>{t('forgotPassword.backToLogin', 'Back to login')}</Text>
            </Pressable>
         </View>
      </View>
   )
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
   },
   card: {
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
   },
   title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 20,
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
   linkText: {
      textAlign: 'center',
      fontWeight: '600',
   },
})
