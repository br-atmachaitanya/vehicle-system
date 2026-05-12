import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/dashboard/DashboardPage'
import TripListPage from './pages/trips/TripListPage'
import VehicleListPage from './pages/vehicles/VehicleListPage'
import SettingsPage from './pages/settings/SettingsPage'

// Temporary placeholder for pages not built yet
// Accepts a name prop to show which page is coming
const Placeholder = ({ name }) => (
  <div className="bg-white rounded-lg p-8 text-center text-gray-400">
    <p className="text-lg">{name}</p>
    <p className="text-sm mt-2">Coming in next phase</p>
  </div>
)

// QueryClient manages all our API data fetching, caching, and loading states
// Think of it as a smart data store for server data
const queryClient = new QueryClient()

export default function App() {
  return (
    // QueryClientProvider makes queryClient available to all child components
    <QueryClientProvider client={queryClient}>
      {/* BrowserRouter enables URL-based navigation */}
      <BrowserRouter>
        {/* Layout wraps every page — sidebar + header stay constant */}
        <Layout>
          {/* Routes looks at the current URL and renders the matching Route */}
          <Routes>
            <Route path="/"          element={<DashboardPage />} />
            <Route path="/trips"     element={<TripListPage />} />
            <Route path="/trips/new" element={<Placeholder name="Trip Entry Form" />} />
            <Route path="/vehicles"  element={<VehicleListPage />} />
            <Route path="/accounts"  element={<Placeholder name="Accounts" />} />
            <Route path="/users"     element={<Placeholder name="Users" />} />
            <Route path="/drivers"   element={<Placeholder name="Drivers" />} />
            <Route path="/reports"   element={<Placeholder name="Reports" />} />
            <Route path="/settings"  element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}