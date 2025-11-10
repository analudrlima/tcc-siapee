import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../services/api'

type User = { id: string; name: string; role: 'ADMIN'|'TEACHER'|'SECRETARY'; avatarUrl?: string|null }
type Tokens = { accessToken: string; refreshToken: string }

type AuthContextType = {
  user: User | null
  tokens: Tokens | null
  loading: boolean
  login: (loginOrEmail: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem('siapee_tokens')
    return raw ? JSON.parse(raw) as Tokens : null
  } catch { return null }
}

function setStoredTokens(tokens: Tokens | null) {
  if (!tokens) { localStorage.removeItem('siapee_tokens'); return }
  localStorage.setItem('siapee_tokens', JSON.stringify(tokens))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<Tokens | null>(getStoredTokens())
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isRefreshing = useRef(false)

  // Setup axios interceptors
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      if (tokens?.accessToken) {
        config.headers = config.headers ?? {}
        ;(config.headers as any).Authorization = `Bearer ${tokens.accessToken}`
      }
      return config
    })
    const resId = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config
        
        // Don't retry refresh endpoint itself to prevent infinite loop
        if (original.url?.includes('/auth/refresh')) {
          return Promise.reject(err)
        }
        
        // Only attempt refresh once and if we have a refresh token
        if (err.response?.status === 401 && tokens?.refreshToken && !original._retried && !isRefreshing.current) {
          original._retried = true
          isRefreshing.current = true
          
          try {
            const r = await api.post('/auth/refresh', { refreshToken: tokens.refreshToken })
            const newAccess = r.data.accessToken as string
            const nextTokens = { accessToken: newAccess, refreshToken: tokens.refreshToken }
            setTokens(nextTokens)
            setStoredTokens(nextTokens)
            isRefreshing.current = false
            original.headers = original.headers ?? {}
            original.headers.Authorization = `Bearer ${newAccess}`
            return api(original)
          } catch (refreshErr) {
            // Refresh failed - clear everything and stop
            isRefreshing.current = false
            setTokens(null)
            setStoredTokens(null)
            setUser(null)
            return Promise.reject(err)
          }
        }
        return Promise.reject(err)
      }
    )
    return () => { api.interceptors.request.eject(reqId); api.interceptors.response.eject(resId) }
  }, [tokens])

  // Load current user if tokens exist
  useEffect(() => {
    (async () => {
      try {
        if (tokens?.accessToken) {
          const r = await api.get('/users/me')
          setUser(r.data)
        } else {
          setUser(null)
        }
      } catch (err) {
        // Clear tokens on user fetch failure to prevent loop
        setTokens(null)
        setStoredTokens(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [tokens])

  const value = useMemo<AuthContextType>(() => ({
    user, tokens, loading,
    login: async (loginOrEmail: string, password: string) => {
      const payload = /@/.test(loginOrEmail) ? { email: loginOrEmail } : { login: loginOrEmail }
      const r = await api.post('/auth/login', { ...payload, password })
      const { accessToken, refreshToken, user: u } = r.data
      const t = { accessToken, refreshToken }
      setTokens(t)
      setStoredTokens(t)
      setUser(u)
    },
    logout: () => { setTokens(null); setStoredTokens(null); setUser(null) }
  }), [user, tokens, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
