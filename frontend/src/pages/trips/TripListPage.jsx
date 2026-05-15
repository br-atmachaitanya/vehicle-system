import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tripApi } from '../../api'
import { institutionApi } from '../../api'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Input from '../../components/ui/Input'
import FormField from '../../components/ui/FormField'
import { useAuth } from '../../context/AuthContext'

// Format HHMM integer to HH:MM string
const fmtTime = (t) => {
  if (!t) return '—'
  const s = String(t).padStart(4, '0')
  return `${s.slice(0, 2)}:${s.slice(2)}`
}

// Format currency
const fmtAmt = (n) => `₹${Number(n || 0).toFixed(2)}`

export default function TripListPage() {
  const [trips, setTrips]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [alert, setAlert]         = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)

  // Filter state
  const [filters, setFilters] = useState({
    date_from:    '',
    date_to:      '',
    vehicle_code: '',
    account_code: '',
    fiscal_year:  '',
  })

  const { user } = useAuth()
  const navigate  = useNavigate()

  // Load institution to get fiscal year default
  useEffect(() => {
    institutionApi.get()
      .then(r => {
        const fy = r.data.fiscal_year_start.slice(-2) +
                   r.data.fiscal_year_end.slice(-2)
        setFilters(f => ({ ...f, fiscal_year: fy }))
      })
      .catch(() => {})
  }, [])

  const loadTrips = () => {
    setLoading(true)

    // Build params — only include non-empty values
    const params = {}
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v
    })

    tripApi.list(params)
      .then(r => {
        setTrips(r.data)
        // Calculate total amount for filtered trips
        const total = r.data.reduce((sum, t) => sum + Number(t.total_charge || 0), 0)
        setTotalAmount(total)
      })
      .catch(() => setAlert({ message: 'Failed to load trips.', type: 'error' }))
      .finally(() => setLoading(false))
  }

  // Load when fiscal year filter is set (after institution loads)
  useEffect(() => {
    if (filters.fiscal_year) loadTrips()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fiscal_year])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleDelete = (id, description) => {
    if (!window.confirm(`Delete this trip record? This cannot be undone.`)) return
    tripApi.delete(id)
      .then(() => {
        setAlert({ message: 'Trip deleted.', type: 'success' })
        loadTrips()
      })
      .catch(() => setAlert({ message: 'Failed to delete trip.', type: 'error' }))
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">
          Trip Journal
          {trips.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({trips.length} records — Total: {fmtAmt(totalAmount)})
            </span>
          )}
        </h3>
        <Button onClick={() => navigate('/trips/new')}>
          + New Trip
        </Button>
      </div>

      {alert && (
        <Alert message={alert.message} type={alert.type}
               onClose={() => setAlert(null)} />
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-5 gap-3 items-end">

          <FormField label="Fiscal Year">
            <Input
              name="fiscal_year"
              value={filters.fiscal_year}
              onChange={handleFilterChange}
              placeholder="e.g. 2627"
              maxLength={4}
            />
          </FormField>

          <FormField label="From Date">
            <Input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
            />
          </FormField>

          <FormField label="To Date">
            <Input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
            />
          </FormField>

          <FormField label="Vehicle Code">
            <Input
              name="vehicle_code"
              value={filters.vehicle_code}
              onChange={handleFilterChange}
              placeholder="e.g. 4000"
              maxLength={4}
            />
          </FormField>

          <div className="flex gap-2">
            <Button onClick={loadTrips} disabled={loading}>
              {loading ? 'Loading...' : 'Filter'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters(f => ({
                  ...f,
                  date_from: '', date_to: '',
                  vehicle_code: '', account_code: '',
                }))
                // Reload after clear
                setTimeout(loadTrips, 100)
              }}
            >
              Clear
            </Button>
          </div>

        </div>
      </div>

      {/* Trip table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Loading trips...</p>
        ) : trips.length === 0 ? (
          <p className="p-6 text-center text-gray-400">
            No trips found. Adjust filters or add a new trip.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Vehicle</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Passenger</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Purpose</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Account</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600">KM</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Dep</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Arr</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  {user?.is_admin && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trips.map((trip, i) => (
                  <tr
                    key={trip.id}
                    className={i % 2 === 0 ? 'bg-white hover:bg-gray-50'
                                           : 'bg-blue-50 hover:bg-blue-100'}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {/* Format date from ISO to DD/MM/YYYY */}
                      {new Date(trip.departure_date)
                        .toLocaleDateString('en-IN', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {trip.vehicle_code}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[120px] truncate">
                      {trip.passenger_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[150px] truncate">
                      {trip.purpose || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {trip.account_code}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {trip.km_run || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {fmtTime(trip.departure_time)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {fmtTime(trip.arrival_time)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium">
                      {fmtAmt(trip.total_charge)}
                    </td>
                    {user?.is_admin && (
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            variant="secondary"
                            className="text-xs px-2 py-1"
                            onClick={() => navigate(`/trips/${trip.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="text-xs px-2 py-1"
                            onClick={() => handleDelete(trip.id)}
                          >
                            Del
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>

              {/* Sticky footer with total */}
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={user?.is_admin ? 8 : 8}
                      className="px-3 py-2 text-xs font-semibold text-right text-gray-700">
                    Total ({trips.length} trips):
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-800">
                    {fmtAmt(totalAmount)}
                  </td>
                  {user?.is_admin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}