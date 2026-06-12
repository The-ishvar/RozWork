import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)
const TOKEN_STORAGE_KEY = 'rozwork_token'
const REMEMBER_ME_STORAGE_KEY = 'rozwork_remember_me'

const buildRegistrationPayload = (formData = {}) => {
  const cleaned = { ...formData }
  delete cleaned.confirmPassword
  delete cleaned.terms
  delete cleaned.rememberMe

  const rawName = String(cleaned.name || '').trim()
  const rawEmail = String(cleaned.email || '').trim()
  const rawRole = cleaned.role || 'worker'
  const usernameBase = rawName
    ? rawName.toLowerCase().replace(/[^a-z0-9]+/g, '')
    : rawEmail.split('@')[0] || 'user'

  return {
    ...cleaned,
    name: rawName,
    email: rawEmail,
    role: rawRole,
    username: cleaned.username || usernameBase,
    profession: cleaned.profession || (rawRole === 'employer' ? 'Employer' : 'Professional'),
    bio: cleaned.bio || (rawRole === 'employer' ? 'Employer looking for reliable talent.' : 'Skilled professional ready for opportunities.'),
    location: cleaned.location || 'Mumbai, India',
    phone: cleaned.phone || '',
    skills: Array.isArray(cleaned.skills) ? cleaned.skills : [],
    experience: Array.isArray(cleaned.experience) ? cleaned.experience : [],
    education: Array.isArray(cleaned.education) ? cleaned.education : [],
    certificates: Array.isArray(cleaned.certificates) ? cleaned.certificates : [],
    portfolio: Array.isArray(cleaned.portfolio) ? cleaned.portfolio : [],
    socialLinks: Array.isArray(cleaned.socialLinks) ? cleaned.socialLinks : [],
  }
}

const persistToken = (nextToken, rememberMe) => {
  if (rememberMe) {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'true')
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    return
  }

  sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
  localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'false')
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REMEMBER_ME_STORAGE_KEY)
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

const readStoredToken = () => {
  const rememberMe = localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true'
  if (rememberMe) return localStorage.getItem(TOKEN_STORAGE_KEY)
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => readStoredToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUser(data.user)
      } catch (error) {
        clearStoredToken()
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadMe()
  }, [token])

  const login = async (identifier, password, rememberMe = false) => {
    const { data } = await apiClient.post('/auth/login', { identifier, password })
    persistToken(data.token, rememberMe)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async (formData, rememberMe = false) => {
    const payload = buildRegistrationPayload(formData)
    const { data } = await apiClient.post('/auth/register', payload)
    if (data?.token) {
      persistToken(data.token, rememberMe)
      setToken(data.token)
      setUser(data.user)
    }
    return data
  }

  const refreshUser = async () => {
    if (!token) return null
    const { data } = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setUser(data.user)
    return data.user
  }

  const updateProfile = async (payload) => {
    const { data } = await apiClient.put('/users/profile', payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setUser(data.user)
    return data.user
  }

  const purchaseService = async (payload) => {
    if (!token) {
      throw new Error('Please log in to complete this action.')
    }

    const { data } = await apiClient.post('/purchases', payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setUser(data.user)
    return data
  }

  const logout = () => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ user, token, loading, login, register, logout, refreshUser, updateProfile, purchaseService }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
