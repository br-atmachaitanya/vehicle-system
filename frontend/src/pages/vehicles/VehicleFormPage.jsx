import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vehicleApi } from '../../api'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

// Vehicle type options for the dropdown
const VEHICLE_TYPES = [
  { value: 'P', label: 'Car / Private' },
  { value: 'V', label: 'Van' },
  { value: 'B', label: 'Bus' },
  { value: 'A', label: 'Ambulance' },
]

const emptyForm = {
  code: '', description: '', registration_number: '',
  vehicle_type: 'P', rate_per_km: 0, credit_account_code: '',
  active: true, display_order: 0,
  road_tax_expiry: '', insurance_expiry: '', fitness_cert_expiry: '',
  permit_expiry: '', puc_expiry: '', vs_toll_tax_expiry: '',
  howrah_stn_expiry: '', sealdah_stn_expiry: '',
}

export default function VehicleFormPage() {
  const [form, setForm]       = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [alert, setAlert]     = useState(null)

  // useParams reads URL parameters
  // For /vehicles/4000/edit → params.code = "4000"
  // For /vehicles/new → params.code = undefined
  const { code } = useParams()
  const navigate  = useNavigate()

  // If code exists in URL, we're editing — fetch existing data
  const isEditing = Boolean(code)

  useEffect(() => {
    if (!isEditing) return  // new vehicle — nothing to fetch

    setFetching(true)
    vehicleApi.get(code)
      .then(r => {
        // Dates come as "2025-12-31" from API
        // HTML date inputs need exactly this format — so no conversion needed
        setForm(r.data)
      })
      .catch(() => setAlert({ message: 'Failed to load vehicle data.', type: 'error' }))
      .finally(() => setFetching(false))
  }, [code, isEditing])

  // Handle regular text/number/date inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      // checkboxes use "checked" not "value"
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      // Convert empty date strings to null (API expects null, not "")
      const payload = { ...form }
      const dateFields = [
        'road_tax_expiry', 'insurance_expiry', 'fitness_cert_expiry',
        'permit_expiry', 'puc_expiry', 'vs_toll_tax_expiry',
        'howrah_stn_expiry', 'sealdah_stn_expiry'
      ]
      dateFields.forEach(f => {
        if (payload[f] === '') payload[f] = null
      })

      if (isEditing) {
        await vehicleApi.update(code, payload)
      } else {
        await vehicleApi.create(payload)
      }

      // Navigate back to list after successful save
      navigate('/vehicles')
    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Failed to save vehicle.',
        type: 'error'
      })
      setLoading(false)
    }
  }

  if (fetching) return <p className="text-gray-400 p-6">Loading vehicle data...</p>

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm p-6">

        {/* Dynamic title based on create vs edit */}
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {isEditing ? `Edit Vehicle — ${code}` : 'Add New Vehicle'}
        </h3>

        {alert && (
          <div className="mb-4">
            <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic details */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vehicle Code *">
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. 4000"
                maxLength={4}
                required
                // Can't change code when editing — it's the primary key
                disabled={isEditing}
              />
            </FormField>
            <FormField label="Display Order">
              <Input
                name="display_order"
                type="number"
                value={form.display_order}
                onChange={handleChange}
                min={0}
              />
            </FormField>
          </div>

          <FormField label="Description *">
            <Input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. MAHINDRA MARAZZO WB12AW/4000"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Registration Number">
              <Input
                name="registration_number"
                value={form.registration_number || ''}
                onChange={handleChange}
                placeholder="e.g. WB 12AW 4000"
              />
            </FormField>
            <FormField label="Vehicle Type">
              {/* select = dropdown — same controlled pattern as input */}
              <select
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VEHICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rate per KM (₹)">
              <Input
                name="rate_per_km"
                type="number"
                value={form.rate_per_km}
                onChange={handleChange}
                min={0}
                step="0.01"  // allows decimal values
              />
            </FormField>
            <FormField label="Credit Account Code">
              <Input
                name="credit_account_code"
                value={form.credit_account_code || ''}
                onChange={handleChange}
                placeholder="e.g. 01"
                maxLength={2}
              />
            </FormField>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              id="active"
              checked={form.active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded"
            />
            {/* htmlFor links label to checkbox by id */}
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Active (appears in trip entry)
            </label>
          </div>

          {/* Certificate dates section */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              Compliance Certificate Dates
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Each date field follows the same pattern */}
              {[
                { name: 'road_tax_expiry',      label: 'Road Tax Expiry' },
                { name: 'insurance_expiry',      label: 'Insurance Expiry' },
                { name: 'fitness_cert_expiry',   label: 'Fitness Certificate' },
                { name: 'permit_expiry',         label: 'Permit Expiry' },
                { name: 'puc_expiry',            label: 'PUC Expiry' },
                { name: 'vs_toll_tax_expiry',    label: 'VS Toll Tax' },
                { name: 'howrah_stn_expiry',     label: 'Howrah Station' },
                { name: 'sealdah_stn_expiry',    label: 'Sealdah Station' },
              ].map(field => (
                <FormField key={field.name} label={field.label}>
                  <Input
                    type="date"          // HTML date picker
                    name={field.name}
                    value={form[field.name] || ''}
                    onChange={handleChange}
                  />
                </FormField>
              ))}
            </div>
          </div>

          {/* Form action buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
            {/* Go back without saving */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/vehicles')}
            >
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}