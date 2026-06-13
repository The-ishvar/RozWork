import axios from 'axios'

const resolveApiBaseUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '')
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