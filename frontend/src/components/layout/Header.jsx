import { useEffect, useState } from 'react'

export default function Header({ title, user, onLogout }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (d) => d.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
  const formatTime = (d) => d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  return (
    <header className="h-14 bg-white border-b border-gray-200
                        flex items-center justify-between px-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>

      <div className="flex items-center gap-6">
        {/* Live clock */}
        <div className="text-right">
          <div className="text-sm font-medium text-gray-800">{formatTime(time)}</div>
          <div className="text-xs text-gray-500">{formatDate(time)}</div>
        </div>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {user.username}
              </div>
              {/* Show admin badge if user is admin */}
              <div className="text-xs text-gray-400">
                {user.is_admin ? '👑 Admin' : 'Operator'}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600
                         px-3 py-1.5 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}