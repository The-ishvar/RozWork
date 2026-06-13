import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const slides = [
   {
      title: 'Find trusted professionals',
      description: 'Discover workers, jobs, and services in your city with secure booking flows.',
   },
   {
      title: 'Move faster with live updates',
      description: 'Track bookings, applications, notifications, and payments from one place.',
   },
   {
      title: 'Built for scale',
      description: 'RozWork is connected to the existing MongoDB-backed backend and admin tools.',
   },
]

export default function OnboardingScreen({ onFinish }) {
   const { theme } = useTheme()
   const [index, setIndex] = useState(0)

   const handleNext = async () => {
      if (index < slides.length - 1) {
         setIndex(index + 1)
         return
      }

      if (onFinish) {
         await onFinish()
      }
   }

   const slide = slides[index]

   return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
         <View style={styles.card}>
            <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: theme.muted }]}>{slide.description}</Text>
            <View style={styles.dots}>
               {slides.map((_, itemIndex) => (
                  <View key={itemIndex} style={[styles.dot, itemIndex === index && { backgroundColor: theme.primary }]} />
               ))}
            </View>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleNext}>
               <Text style={styles.buttonText}>{index === slides.length - 1 ? 'Get started' : 'Continue'}</Text>
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
      backgroundColor: '#ffffff',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
   },
   title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 12,
   },
   description: {
      fontSize: 16,
      lineHeight: 24,
   },
   dots: {
      flexDirection: 'row',
      marginVertical: 24,
      gap: 8,
   },
   dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: '#cbd5e1',
   },
   button: {
      paddingVertical: 14,
      borderRadius: 999,
      alignItems: 'center',
   },
   buttonText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 16,
   },
})
