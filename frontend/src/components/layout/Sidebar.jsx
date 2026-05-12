// NavLink is like <a> but it knows if it's the current page
// and adds an "active" style automatically
import { NavLink } from 'react-router-dom'

// Array of all navigation items
// Keeping this as data (not hardcoded JSX) makes it easy to add/remove items
const navItems = [
  { path: '/',         label: 'Dashboard',  icon: '🏠' },
  { path: '/trips',    label: 'Trip Entry', icon: '🚗' },
  { path: '/vehicles', label: 'Vehicles',   icon: '🚙' },
  { path: '/accounts', label: 'Accounts',   icon: '📋' },
  { path: '/users',    label: 'Users',      icon: '👤' },
  { path: '/drivers',  label: 'Drivers',    icon: '👨‍✈️' },
  { path: '/reports',  label: 'Reports',    icon: '📊' },
  { path: '/settings', label: 'Settings',   icon: '⚙️'  },
]

export default function Sidebar() {
  return (
    // min-h-screen = at least full screen height
    // flex flex-col = stack children vertically
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Institution branding at the top */}
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-sm font-bold text-yellow-400 leading-tight">
          Ramakrishna Math and Ramakrishna Mission
        </h1>
        <p className="text-xs text-gray-400 mt-1">Vehicle Department</p>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 py-4">
        {/* .map() loops over navItems array and creates one NavLink per item */}
        {navItems.map(item => (
          <NavLink
            key={item.path}        // React needs unique key when rendering lists
            to={item.path}         // where to navigate on click
            end={item.path === '/'} // "end" prevents / from matching all routes
            className={({ isActive }) =>  // NavLink passes isActive to className function
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
               ${isActive
                 ? 'bg-yellow-500 text-gray-900 font-semibold'  // active page style
                 : 'text-gray-300 hover:bg-gray-800'            // inactive style
               }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Version number at bottom */}
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        v1.0.0
      </div>
    </aside>
  )
}