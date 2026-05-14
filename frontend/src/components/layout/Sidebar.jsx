import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Split nav items into two groups
const operatorNavItems = [
  { path: '/',         label: 'Dashboard',  icon: '🏠' },
  { path: '/trips',    label: 'Trip Entry', icon: '🚗' },
  { path: '/reports',  label: 'Reports',    icon: '📊' },
]

const adminNavItems = [
  { path: '/vehicles', label: 'Vehicles',   icon: '🚙' },
  { path: '/accounts', label: 'Accounts',   icon: '📋' },
  { path: '/users',    label: 'Users',      icon: '👤' },
  { path: '/drivers',  label: 'Drivers',    icon: '👨‍✈️' },
  { path: '/settings', label: 'Settings',   icon: '⚙️'  },
]

export default function Sidebar() {
  const { user } = useAuth()

  // Combine based on role
  const navItems = user?.is_admin
    ? [...operatorNavItems, ...adminNavItems]
    : operatorNavItems

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-sm font-bold text-yellow-400 leading-tight">
          Ramakrishna Math
        </h1>
        <p className="text-xs text-gray-400 mt-1">Vehicle Department</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
               ${isActive
                 ? 'bg-yellow-500 text-gray-900 font-semibold'
                 : 'text-gray-300 hover:bg-gray-800'}`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Show role indicator at bottom */}
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        <div>v1.0.0</div>
        {user && (
          <div className="mt-1 text-yellow-600">
            {user.is_admin ? '👑 Admin' : '👤 Operator'}
          </div>
        )}
      </div>
    </aside>
  )
}