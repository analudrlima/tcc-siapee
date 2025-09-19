import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

type User = { id: string; name: string; role: 'ADMIN'|'TEACHER'|'SECRETARY' }
type Tokens = { accessToken: string; refreshToken: string }

type AuthContextType = {
  user: User | null
  tokens: Tokens | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
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
        if (err.response?.status === 401 && tokens?.refreshToken && !original._retried) {
          original._retried = true
          try {
            const r = await api.post('/auth/refresh', { refreshToken: tokens.refreshToken })
            const newAccess = r.data.accessToken as string
            const nextTokens = { accessToken: newAccess, refreshToken: tokens.refreshToken }
            setTokens(nextTokens)
            setStoredTokens(nextTokens)
            original.headers = original.headers ?? {}
            original.headers.Authorization = `Bearer ${newAccess}`
            return api(original)
          } catch {
            setTokens(null); setStoredTokens(null); setUser(null)
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
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [tokens])

  const value = useMemo<AuthContextType>(() => ({
    user, tokens, loading,
    login: async (email: string, password: string) => {
      const r = await api.post('/auth/login', { email, password })
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
