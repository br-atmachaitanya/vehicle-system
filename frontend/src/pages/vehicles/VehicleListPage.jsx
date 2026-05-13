import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'  // for programmatic navigation
import { vehicleApi } from '../../api'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

export default function VehicleListPage() {
  const [vehicles, setVehicles] = useState([])   // list of vehicles from API
  const [loading, setLoading]   = useState(true) // true while fetching
  const [alert, setAlert]       = useState(null)

  // useNavigate returns a function we call to navigate programmatically
  // e.g. navigate('/vehicles/new') instead of clicking a link
  const navigate = useNavigate()

  // Fetch vehicles from API
  const loadVehicles = () => {
    setLoading(true)
    vehicleApi.list()
      .then(r => setVehicles(r.data))
      .catch(() => setAlert({ message: 'Failed to load vehicles', type: 'error' }))
      .finally(() => setLoading(false))  // always runs, success or failure
  }

  // Load on mount
  useEffect(() => { loadVehicles() }, [])

  const handleDelete = (code, description) => {
    // Confirm before deleting — simple browser confirm dialog for now
    if (!window.confirm(`Delete vehicle "${description}"? This cannot be undone.`)) return

    vehicleApi.delete(code)
      .then(() => {
        setAlert({ message: `Vehicle ${description} deleted.`, type: 'success' })
        loadVehicles()  // refresh the list
      })
      .catch(() => setAlert({ message: 'Failed to delete vehicle.', type: 'error' }))
  }

  // Format date from ISO string to DD/MM/YYYY
  // Returns '—' if date is null
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' })
  }

  // Check if a certificate date is expiring within 30 days or already expired
  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false
    const expiry = new Date(dateStr)
    const today = new Date()
    const diffDays = (expiry - today) / (1000 * 60 * 60 * 24)  // convert ms to days
    return diffDays < 30  // true if expiring within 30 days
  }

  return (
    <div className="space-y-4">

      {/* Page header with Add button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">
          Vehicles ({vehicles.length})
        </h3>
        <Button onClick={() => navigate('/vehicles/new')}>
          + Add Vehicle
        </Button>
      </div>

      {/* Alert */}
      {alert && (
        <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Loading...</p>
        ) : vehicles.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No vehicles found. Add one to get started.</p>
        ) : (
          // overflow-x-auto = horizontal scroll on small screens
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {/* text-left = left-align header text */}
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Reg. No.</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Insurance</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Fitness</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Loop over vehicles array, one row per vehicle */}
                {vehicles.map(vehicle => (
                  <tr key={vehicle.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{vehicle.code}</td>
                    <td className="px-4 py-3">{vehicle.description}</td>
                    <td className="px-4 py-3 font-mono text-xs">{vehicle.registration_number || '—'}</td>
                    <td className="px-4 py-3">
                      {/* Show human-readable type */}
                      {vehicle.vehicle_type === 'P' ? 'Car' : vehicle.vehicle_type}
                    </td>

                    {/* Insurance expiry — red if expiring soon */}
                    <td className={`px-4 py-3 ${isExpiringSoon(vehicle.insurance_expiry) ? 'text-red-600 font-semibold' : ''}`}>
                      {formatDate(vehicle.insurance_expiry)}
                    </td>

                    <td className={`px-4 py-3 ${isExpiringSoon(vehicle.fitness_cert_expiry) ? 'text-red-600 font-semibold' : ''}`}>
                      {formatDate(vehicle.fitness_cert_expiry)}
                    </td>

                    {/* Active/Inactive badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${vehicle.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {vehicle.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/vehicles/${vehicle.code}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(vehicle.code, vehicle.description)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}