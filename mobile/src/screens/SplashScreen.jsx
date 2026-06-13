import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export default function SplashScreen() {
   const { theme } = useTheme()
   const fadeAnim = useRef(new Animated.Value(0)).current
   const scaleAnim = useRef(new Animated.Value(0.95)).current

   useEffect(() => {
      Animated.parallel([
         Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
         Animated.timing(scaleAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]).start()
   }, [fadeAnim, scaleAnim])

   return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
         <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <Text style={[styles.title, { color: theme.text }]}>RozWork</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Professional work and service marketplace</Text>
         </Animated.View>
      </View>
   )
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
   },
   title: {
      fontSize: 40,
      fontWeight: '800',
      textAlign: 'center',
   },
   subtitle: {
      marginTop: 12,
      fontSize: 16,
      textAlign: 'center',
   },
})
