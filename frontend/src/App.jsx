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
import AccountsPage from './pages/accounts/AccountsPage'
import UsersPage from './pages/users/UsersPage'
import DriversPage from './pages/drivers/DriversPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <LoginPage />
      } />

      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/"                    element={<DashboardPage />} />

              {/* Trips */}
              <Route path="/trips"               element={<TripListPage />} />
              <Route path="/trips/new"           element={<TripEntryPage />} />
              <Route path="/trips/:id/edit"      element={
                <AdminRoute><TripEntryPage /></AdminRoute>
              } />

              {/* Vehicles */}
              <Route path="/vehicles"            element={<VehicleListPage />} />
              <Route path="/vehicles/new"        element={
                <AdminRoute><VehicleFormPage /></AdminRoute>
              } />
              <Route path="/vehicles/:code/edit" element={
                <AdminRoute><VehicleFormPage /></AdminRoute>
              } />

              {/* Masters */}
              <Route path="/accounts"            element={<AccountsPage />} />
              <Route path="/users"               element={<UsersPage />} />
              <Route path="/drivers"             element={<DriversPage />} />

              {/* Reports & Settings */}
              <Route path="/reports"             element={<ReportsPage />} />
              <Route path="/settings"            element={
                <AdminRoute><SettingsPage /></AdminRoute>
              } />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
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