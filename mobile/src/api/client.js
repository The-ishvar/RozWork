import axios from 'axios'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

const resolveApiBaseUrl = () => {
  const configured = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://roz-1-xemo.onrender.com/api'
  }

  return 'http://localhost:5000/api'
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('rozwork_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
