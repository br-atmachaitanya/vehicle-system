import { useEffect, useState } from 'react'
import client from '../../api/client'

// A reusable card component for showing a single stat
// Props: label (text), value (number), color (tailwind border class)
function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-lg border-l-4 ${color} shadow-sm p-5`}>
      <p className="text-sm text-gray-500">{label}</p>
      {/* ?? '—' means: show '—' if value is null or undefined */}
      <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
    </div>
  )
}

export default function DashboardPage() {
  // null = not loaded yet
  const [institution, setInstitution] = useState(null)

  // Object to hold multiple stats together
  const [stats, setStats] = useState({ trips: 0, vehicles: 0, drivers: 0 })

  // Fetch data when component loads
  useEffect(() => {
    // Each API call is independent — they run in parallel
    // .catch(() => {}) silences errors if data doesn't exist yet
    client.get('/api/institution/')
      .then(r => setInstitution(r.data))
      .catch(() => {})

    client.get('/api/vehicles/')
      .then(r => setStats(s => ({ ...s, vehicles: r.data.length })))
      .catch(() => {})

    // ...s spreads existing stats, then overrides just the one we're updating
    // This prevents overwriting other stats while one is loading
    client.get('/api/drivers/')
      .then(r => setStats(s => ({ ...s, drivers: r.data.length })))
      .catch(() => {})

    client.get('/api/trips/')
      .then(r => setStats(s => ({ ...s, trips: r.data.length })))
      .catch(() => {})
  }, []) // empty array = run once on mount

  return (
    <div className="space-y-6"> {/* space-y-6 = vertical gap between children */}

      {/* Institution info banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
        <h3 className="font-bold text-gray-800 text-lg">
          {/* Show name if loaded, otherwise prompt to configure */}
          {institution?.name ?? 'Institution not configured — go to Settings'}
        </h3>
        {/* Only render this line if institution data exists */}
        {institution && (
          <p className="text-sm text-gray-600 mt-1">
            {institution.city} &nbsp;|&nbsp; Fiscal Year:{' '}
            <strong>{institution.fiscal_year_start}–{institution.fiscal_year_end}</strong>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Trips This Year"  value={stats.trips}    color="border-blue-500"   />
        <StatCard label="Active Vehicles"  value={stats.vehicles} color="border-green-500"  />
        <StatCard label="Drivers"          value={stats.drivers}  color="border-yellow-500" />
      </div>

      {/* Quick action buttons */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h4 className="font-semibold text-gray-700 mb-3">Quick Actions</h4>
        <div className="flex gap-3">
          <a href="/trips/new"
             className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            + New Trip Entry
          </a>
          <a href="/reports"
             className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200">
            Generate Report
          </a>
        </div>
      </div>
    </div>
  )
}