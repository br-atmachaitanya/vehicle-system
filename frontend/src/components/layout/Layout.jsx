import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation } from 'react-router-dom'

// useLocation is a React Router hook that tells us the current URL path
// We use it to show the correct page title in the header

const titles = {
  '/':          'Dashboard',
  '/trips':     'Trip Journal',
  '/trips/new': 'New Trip Entry',
  '/vehicles':  'Vehicle Master',
  '/accounts':  'Account Master',
  '/users':     'User Master',
  '/drivers':   'Driver Master',
  '/reports':   'Reports',
  '/settings':  'Institution Settings',
}

// children is a special React prop — it means "whatever is between the tags"
// <Layout><DashboardPage /></Layout>  →  children = <DashboardPage />
export default function Layout({ children }) {
  const location = useLocation()

  // Get title for current path, fallback to default
  const title = titles[location.pathname] || 'Vehicle System'

  return (
    // h-screen = full viewport height, overflow-hidden = no page-level scrollbar
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar stays fixed on the left */}
      <Sidebar />

      {/* Main area takes remaining width, scrolls independently */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />

        {/* overflow-y-auto = scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}  {/* the actual page renders here */}
        </main>
      </div>
    </div>
  )
}