import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import TripListPage from './pages/trips/TripListPage'
import TripEntryPage from './pages/trips/TripEntryPage'
import VehicleListPage from './pages/vehicles/VehicleListPage'
import VehicleFormPage from './pages/vehicles/VehicleFormPage'
import SettingsPage from './pages/settings/SettingsPage'

const Placeholder = ({ name }) => (
  <div className="bg-white rounded-lg p-8 text-center text-gray-400">
    <p className="text-lg">{name}</p>
    <p className="text-sm mt-2">Coming soon</p>
  </div>
)

const queryClient = new QueryClient()

// ProtectedRoute — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Still checking stored token — show nothing
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  // Not logged in — redirect to login
  if (!user) return <Navigate to="/login" replace />

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public route — no layout */}
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* All other routes are protected */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/"                    element={<DashboardPage />} />
              <Route path="/trips"               element={<TripListPage />} />
              <Route path="/trips/new"           element={<AdminRoute><TripEntryPage /></AdminRoute>} />
              <Route path="/vehicles"            element={<VehicleListPage />} />
              <Route path="/vehicles/new"        element={<AdminRoute><VehicleFormPage /></AdminRoute>} />
              <Route path="/vehicles/:code/edit" element={<AdminRoute><VehicleFormPage /></AdminRoute>} />
              <Route path="/accounts"            element={<Placeholder name="Accounts" />} />
              <Route path="/users"               element={<Placeholder name="Users" />} />
              <Route path="/drivers"             element={<Placeholder name="Drivers" />} />
              <Route path="/reports"             element={<Placeholder name="Reports" />} />
              <Route path="/settings"            element={<AdminRoute><SettingsPage /></AdminRoute>} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null

  // Not logged in → login page
  if (!user) return <Navigate to="/login" replace />

  // Logged in but not admin → back to dashboard with a message
  if (!user.is_admin) return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}