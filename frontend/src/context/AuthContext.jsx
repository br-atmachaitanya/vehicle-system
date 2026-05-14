import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

// Context = a way to share state across the whole component tree
// without passing props through every level
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)    // null = not logged in
  const [loading, setLoading] = useState(true)    // checking stored token

  // On app start, check if there's a saved token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Attach token to all future requests
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Verify token is still valid
      client.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem('token')
          delete client.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete client.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — any component can call useAuth() to get user/login/logout
export const useAuth = () => useContext(AuthContext)