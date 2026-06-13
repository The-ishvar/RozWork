import axios from 'axios'

const DEFAULT_API_URL = 'https://roz-1-xemo.onrender.com/api'

const normalizeConfiguredUrl = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/\/$/, '')
}

const resolveApiBaseUrl = () => {
  const configuredUrl = normalizeConfiguredUrl(
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL,
  )

  if (configuredUrl) {
    if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
      return configuredUrl
    }

    if (configuredUrl.startsWith('/')) {
      if (typeof window !== 'undefined' && window.location?.hostname) {
        const host = window.location.hostname
        if (host === 'localhost' || host === '127.0.0.1') {
          return configuredUrl
        }
      }

      return DEFAULT_API_URL
    }
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
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const method = config.method?.toUpperCase() || 'GET'
    const url = `${config.baseURL || ''}${config.url || ''}`
    console.info(`[api] ${method} ${url}`)
  }

  return config
}, (error) => {
  console.error('[api] request failed', error)
  return Promise.reject(error)
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    const baseURL = error.config?.baseURL
    console.error('[api] response error', { status, url, baseURL, message: error.message, data: error.response?.data })
    return Promise.reject(error)
  },
)

export default apiClient