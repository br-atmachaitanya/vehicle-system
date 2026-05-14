import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [alert, setAlert]       = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  // Check if system needs initial setup
  useEffect(() => {
    authApi.setupStatus()
      .then(r => setNeedsSetup(!r.data.initialized))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      if (needsSetup) {
        // First run — create admin account
        await authApi.setupInit(username, password)
        setAlert({
          message: 'Admin account created. Logging you in...',
          type: 'success'
        })
        // Now log in with the new credentials
      }

      const r = await authApi.login(username, password)
      login(r.data.access_token, {
        username: r.data.username,
        is_admin: r.data.is_admin,
      })
      navigate('/')

    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Login failed.',
        type: 'error'
      })
      setLoading(false)
    }
  }

  return (
    // Full screen centered layout
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            Ramakrishna Math
          </h1>
          <p className="text-sm text-gray-500 mt-1">Vehicle Department System</p>
        </div>

        {/* First-run notice */}
        {needsSetup && (
          <div className="mb-4 bg-blue-50 border border-blue-200
                          rounded p-3 text-sm text-blue-800">
            First run detected. Enter a username and password to create
            the admin account.
          </div>
        )}

        {alert && (
          <div className="mb-4">
            <Alert
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Username
            </label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'Please wait...'
              : needsSetup ? 'Create Admin & Login' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  )
}