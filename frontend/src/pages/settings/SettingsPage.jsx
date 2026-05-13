import { useState, useEffect } from 'react'
import { institutionApi } from '../../api'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

// Initial empty form state — mirrors the Institution schema
const emptyForm = {
  name: '',
  address: '',
  city: '',
  pin_code: '',
  phone: '',
  fax: '',
  fiscal_year_start: '',
  fiscal_year_end: '',
  km_margin: 0,
  frequent_destinations: '',
}

export default function SettingsPage() {
  // form holds all the current input values
  const [form, setForm]           = useState(emptyForm)

  // isNew tracks whether we need POST (create) or PUT (update)
  const [isNew, setIsNew]         = useState(true)

  // loading = API call in progress (disables the Save button)
  const [loading, setLoading]     = useState(false)

  // alert = { message, type } — shown after save attempt
  const [alert, setAlert]         = useState(null)

  // Fetch existing institution data when page loads
  useEffect(() => {
    institutionApi.get()
      .then(r => {
        setForm(r.data)   // populate form with existing data
        setIsNew(false)   // it exists, so we'll use PUT
      })
      .catch(() => {
        setIsNew(true)    // 404 = doesn't exist yet, we'll use POST
      })
  }, [])

  // Generic change handler — works for any input field
  // e.target.name = the input's name attribute (matches form field names)
  // e.target.value = what the user typed
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,          // keep all existing field values
      [name]: value     // override just the field that changed
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()    // prevent browser from reloading the page
    setLoading(true)
    setAlert(null)        // clear any previous alert

    try {
      // Choose POST or PUT based on whether record exists
      if (isNew) {
        await institutionApi.create(form)
        setIsNew(false)   // now it exists
      } else {
        await institutionApi.update(form)
      }
      setAlert({ message: 'Settings saved successfully.', type: 'success' })
    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Failed to save settings.',
        type: 'error'
      })
    } finally {
      setLoading(false)   // always re-enable the button
    }
  }

  return (
    <div className="max-w-2xl">  {/* limit width for readability */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Institution Settings
        </h3>

        {/* Show alert if there is one */}
        {alert && (
          <div className="mb-4">
            <Alert
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* onSubmit = called when form submitted (button click or Enter key) */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label="Institution Name *">
            <Input
              name="name"           // matches form field name
              value={form.name}     // controlled: React holds the value
              onChange={handleChange}
              placeholder="e.g. Ramakrishna Math & Mission"
              required              // browser-level validation
            />
          </FormField>

          <FormField label="Address">
            <Input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Street address"
            />
          </FormField>

          {/* Two fields side by side using grid */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City">
              <Input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Howrah"
              />
            </FormField>
            <FormField label="PIN Code">
              <Input
                name="pin_code"
                value={form.pin_code}
                onChange={handleChange}
                placeholder="e.g. 711202"
                maxLength={6}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone">
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </FormField>
            <FormField label="Fax">
              <Input
                name="fax"
                value={form.fax}
                onChange={handleChange}
                placeholder="Fax number"
              />
            </FormField>
          </div>

          {/* Fiscal year section */}
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              Fiscal Year (April–March)
            </p>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Start Year *">
                <Input
                  name="fiscal_year_start"
                  value={form.fiscal_year_start}
                  onChange={handleChange}
                  placeholder="e.g. 2026"
                  maxLength={4}
                  required
                />
              </FormField>
              <FormField label="End Year *">
                <Input
                  name="fiscal_year_end"
                  value={form.fiscal_year_end}
                  onChange={handleChange}
                  placeholder="e.g. 2027"
                  maxLength={4}
                  required
                />
              </FormField>
              <FormField label="KM Tolerance Margin">
                <Input
                  name="km_margin"
                  type="number"
                  value={form.km_margin}
                  onChange={handleChange}
                  min={0}
                  max={20}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Frequent Destinations (optional notes)">
            {/* textarea for multi-line text — not using Input component */}
            <textarea
              name="frequent_destinations"
              value={form.frequent_destinations || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Airport, Belur Math, Seva Pratisthan..."
            />
          </FormField>

          {/* Form actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {/* Show different text while saving */}
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}