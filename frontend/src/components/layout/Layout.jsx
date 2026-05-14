import Sidebar from './Sidebar'
import Header from './Header'
// useLocation is a React Router hook that tells us the current URL path
// We use it to show the correct page title in the header
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'


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
  const { user, logout } = useAuth()
  // Get title for current path, fallback to default
  const title = titles[location.pathname] || 'Vehicle System'

  return (
    // h-screen = full viewport height, overflow-hidden = no page-level scrollbar
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} user={user} onLogout={logout} />     
        <main className="flex-1 overflow-y-auto p-6">
          {children}  {/* the actual page renders here */}
        </main>
      </div>
    </div>
  )
}