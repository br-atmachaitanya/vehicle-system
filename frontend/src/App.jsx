import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/dashboard/DashboardPage'
import TripListPage from './pages/trips/TripListPage'
import VehicleListPage from './pages/vehicles/VehicleListPage'
import VehicleFormPage from './pages/vehicles/VehicleFormPage'  // new
import SettingsPage from './pages/settings/SettingsPage'         // new

const Placeholder = ({ name }) => (
  <div className="bg-white rounded-lg p-8 text-center text-gray-400">
    <p className="text-lg">{name}</p>
    <p className="text-sm mt-2">Coming soon</p>
  </div>
)

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"                      element={<DashboardPage />} />
            <Route path="/trips"                 element={<TripListPage />} />
            <Route path="/trips/new"             element={<Placeholder name="Trip Entry Form" />} />
            <Route path="/vehicles"              element={<VehicleListPage />} />
            <Route path="/vehicles/new"          element={<VehicleFormPage />} />         {/* new */}
            <Route path="/vehicles/:code/edit"   element={<VehicleFormPage />} />         {/* new */}
            <Route path="/accounts"              element={<Placeholder name="Accounts" />} />
            <Route path="/users"                 element={<Placeholder name="Users" />} />
            <Route path="/drivers"               element={<Placeholder name="Drivers" />} />
            <Route path="/reports"               element={<Placeholder name="Reports" />} />
            <Route path="/settings"              element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}