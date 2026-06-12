import axios from 'axios'

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const host = window.location.hostname
    return `${protocol}//${host}:5000/api`
  }

  return 'http://localhost:5000/api'
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
})

export default apiClient
