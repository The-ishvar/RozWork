import axios from 'axios'

const DEFAULT_API_URL = 'https://roz-1-xemo.onrender.com/api'

const resolveApiBaseUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '')
  }

  if (import.meta.env.PROD) {
    return DEFAULT_API_URL
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`
  }

  return 'http://localhost:5000/api'
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient;