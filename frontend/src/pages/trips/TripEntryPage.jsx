import { useState, useEffect, useCallback } from 'react'
import {
  vehicleApi, accountApi, driverApi,
  creditAccountApi, fixedRateApi, purposeApi,
  tripApi, institutionApi
} from '../../api'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ChargeSummary from '../../components/ui/ChargeSummary'
import Combobox from '../../components/ui/Combobox'
import client from '../../api/client'

// Today's date in YYYY-MM-DD format (required by HTML date input)
const today = () => new Date().toISOString().split('T')[0]

// Build initial empty form
// Having this as a function (not constant) means each reset gets a fresh object
const emptyForm = () => ({
  departure_date:       today(),
  arrival_date:         today(),
  vehicle_code:         '',
  account_code:         '',
  driver_code:          '',
  credit_account_code:  '',
  passenger_name:       '',
  name_from_master:     true,
  purpose:              '',
  purpose_extra:        '',
  odometer_out:         '',
  odometer_in:          '',
  km_run:               '',
  departure_time:       '',
  arrival_time:         '',
  duration_minutes:     '',
  charge_method:        'F',    // F=Fixed, K=Per-km
  fixed_rate_code:      '',
  fixed_rate_amount:    0,
  extra_km:             0,
  extra_km_billed:      false,
  extra_km_charge:      0,
  override_amount:      0,
  total_charge:         0,
  fiscal_year:          '',
})

export default function TripEntryPage() {
  const [form, setForm]           = useState(emptyForm())
  const [loading, setLoading]     = useState(false)
  const [alert, setAlert]         = useState(null)
  const [charge, setCharge]       = useState(null)   // charge breakdown from API

  // Master data for dropdowns
  const [vehicles, setVehicles]           = useState([])
  const [accounts, setAccounts]           = useState([])
  const [drivers, setDrivers]             = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [fixedRates, setFixedRates]       = useState([])
  const [purposes, setPurposes]           = useState([])
  const [institution, setInstitution]     = useState(null)

  // Load all master data and institution settings on mount
  useEffect(() => {
    // Load all in parallel using Promise.all
    // Even if one fails, others still load
    Promise.all([
      vehicleApi.list(true),         // active vehicles only
      accountApi.list(),
      driverApi.list(),
      creditAccountApi.list(),
      fixedRateApi.list(),
      purposeApi.list(),
      institutionApi.get(),
      client.get('/api/users'),
    ]).then(([v, a, d, cr, fr, p, inst, u]) => {
      setVehicles(v.data)
      setAccounts(a.data)
      setDrivers(d.data)
      setCreditAccounts(cr.data)
      setFixedRates(fr.data)
      setPurposes(p.data)
      setInstitution(inst.data)
      setUsers(u.data)   // need: const [users, setUsers] = useState([])

      // Pre-fill fiscal year from institution settings
      const fy = inst.data.fiscal_year_start.slice(-2) +
                 inst.data.fiscal_year_end.slice(-2)   // "2627"
      setForm(f => ({ ...f, fiscal_year: fy }))
    }).catch(() => {
      setAlert({ message: 'Failed to load form data. Check backend.', type: 'error' })
    })
  }, [])
  // Add this handler for saving new purposes
  const handleNewPurpose = async (text) => {
    try {
      await purposeApi.create(text)
      // Refresh purposes list so new entry appears in future
      const r = await purposeApi.list()
      setPurposes(r.data)
    } catch (err) {
      console.error('Failed to save new purpose:', err)
    }
}
  // When vehicle changes, auto-fill credit account from vehicle's default
  const handleVehicleChange = (code) => {
    const vehicle = vehicles.find(v => v.code === code)
    setForm(prev => ({
      ...prev,
      vehicle_code: code,
      // Only set credit account if not already manually chosen
      credit_account_code: vehicle?.credit_account_code || prev.credit_account_code,
    }))
  }

  // Generic field change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Calculate KM run when odometer values change
  const handleOdometerChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const updated = { ...prev, [name]: value }

      // Auto-calculate km_run if both values are present
      const out = parseInt(name === 'odometer_out' ? value : prev.odometer_out)
      const inn = parseInt(name === 'odometer_in'  ? value : prev.odometer_in)

      if (!isNaN(out) && !isNaN(inn) && inn >= out) {
        updated.km_run = inn - out
      }
      return updated
    })
  }

  // Calculate duration when times change
  const handleTimeChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const updated = { ...prev, [name]: value }

      // Parse HH:MM strings to minutes since midnight
      const toMins = (t) => {
        if (!t) return null
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      }

      const depTime = name === 'departure_time' ? value : prev.departure_time
      const arrTime = name === 'arrival_time'   ? value : prev.arrival_time
      const depMins = toMins(depTime)
      const arrMins = toMins(arrTime)

      if (depMins !== null && arrMins !== null && arrMins >= depMins) {
        updated.duration_minutes = arrMins - depMins
      }
      return updated
    })
  }

  // When fixed rate changes, fill in the rate amount and threshold
  const handleFixedRateChange = (code) => {
    const rate = fixedRates.find(r => r.code === code)
    setForm(prev => ({
      ...prev,
      fixed_rate_code:   code,
      fixed_rate_amount: rate?.fixed_amount || 0,
    }))
  }

  // useCallback memoizes this function so it doesn't recreate on every render
  // We call this whenever any charge-related field changes
  const recalculateCharge = useCallback(async (currentForm) => {
    // Need at least km_run and a charge method to calculate
    if (!currentForm.km_run || !currentForm.charge_method) return

    // For fixed rate, need the rate selected
    if (currentForm.charge_method === 'F' && !currentForm.fixed_rate_code) return

    const selectedRate = fixedRates.find(r => r.code === currentForm.fixed_rate_code)
    const selectedVehicle = vehicles.find(v => v.code === currentForm.vehicle_code)
    const selectedAccount = accounts.find(a => a.code === currentForm.account_code)

    // Rate priority: vehicle rate > account rate > 0
    const ratePerKm = selectedVehicle?.rate_per_km
                   || selectedAccount?.rate_per_km
                   || 0

    try {
      const r = await tripApi.calculateCharge({
        charge_method:      currentForm.charge_method,
        km_run:             currentForm.km_run,
        fixed_amount:       selectedRate?.fixed_amount || 0,
        distance_threshold: selectedRate?.distance_threshold_km || 0,
        rate_per_km:        ratePerKm,
        override_amount:    currentForm.override_amount || 0,
        bill_extra_km:      currentForm.extra_km_billed,
      })

      setCharge(r.data)

      // Update form with calculated values
      setForm(prev => ({
        ...prev,
        extra_km:        r.data.extra_km,
        extra_km_charge: r.data.extra_km_charge,
        total_charge:    r.data.total_charge,
      }))
    } catch (err) {
      console.error('Charge calculation failed:', err)
    }
  }, [fixedRates, vehicles, accounts])

  // Re-run charge calculation whenever relevant fields change
  useEffect(() => {
    recalculateCharge(form)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.km_run,
    form.charge_method,
    form.fixed_rate_code,
    form.extra_km_billed,
    form.override_amount,
    form.vehicle_code,
    form.account_code,
  ])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Manual validation for fields we care about
    if (!form.vehicle_code) {
      setAlert({ message: 'Please select a vehicle.', type: 'error' })
      return
    }
    if (!form.account_code) {
      setAlert({ message: 'Please select a debit account.', type: 'error' })
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      // Build payload — convert empty strings to null
      const payload = { ...form }
      ;['arrival_date', 'odometer_out', 'odometer_in',
        'departure_time', 'arrival_time', 'duration_minutes'
       ].forEach(f => {
          if (payload[f] === '' || payload[f] === undefined) payload[f] = null
       })

      // Convert HH:MM time strings to HHMM integers (matching DB schema)
      if (payload.departure_time) {
        payload.departure_time = parseInt(payload.departure_time.replace(':', ''))
      }
      if (payload.arrival_time) {
        payload.arrival_time = parseInt(payload.arrival_time.replace(':', ''))
      }

      // Convert km values to integers
      ;['km_run', 'odometer_out', 'odometer_in'].forEach(f => {
        if (payload[f]) payload[f] = parseInt(payload[f])
      })

      await tripApi.create(payload)

      setAlert({ message: 'Trip saved successfully!', type: 'success' })
      setCharge(null)

      // Reset form but keep fiscal year and today's date
      setForm({
        ...emptyForm(),
        fiscal_year: form.fiscal_year,
      })
    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Failed to save trip.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }
  // Build user options for passenger combobox
// Uses formal_name as label, formal_name as value (free text field)
  const passengerOptions = users.map(u => ({
    value: u.formal_name,
    label: u.formal_name,
  }))
  // Convert master data arrays to { value, label } format for SearchableSelect
  const vehicleOptions = vehicles.map(v => ({
    value: v.code,
    label: `${v.code} — ${v.description}`
  }))
  const accountOptions = accounts.map(a => ({
    value: a.code,
    label: `${a.code} — ${a.name}`
  }))
  const driverOptions = drivers.map(d => ({
    value: d.code,
    label: d.name
  }))
  const creditAccountOptions = creditAccounts.map(c => ({
    value: c.code,
    label: c.name
  }))
  const fixedRateOptions = fixedRates.map(r => ({
    value: r.code,
    label: `${r.description} (₹${r.fixed_amount} / ${r.distance_threshold_km}km)`
  }))
  const purposeOptions = purposes.map(p => ({
    value: p.text,
    label: p.text
  }))

  // Find selected fixed rate for display
  const selectedFixedRate = fixedRates.find(r => r.code === form.fixed_rate_code)

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-6">

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">New Trip Entry</h3>
          {/* Show fiscal year as a badge */}
          {form.fiscal_year && (
            <span className="bg-yellow-100 text-yellow-800 text-xs
                             font-semibold px-3 py-1 rounded-full">
              FY {form.fiscal_year}
            </span>
          )}
        </div>

        {alert && (
          <div className="mb-4">
            <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── SECTION 1: Dates & Vehicle ── */}
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Departure Date *">
              <Input
                type="date"
                name="departure_date"
                value={form.departure_date}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Arrival Date">
              <Input
                type="date"
                name="arrival_date"
                value={form.arrival_date}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Vehicle *">
              <SearchableSelect
                options={vehicleOptions}
                value={form.vehicle_code}
                onChange={handleVehicleChange}
                placeholder="Select vehicle..."
              />
            </FormField>
          </div>

          {/* ── SECTION 2: Account & Passenger ── */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Debit Account *">
              <SearchableSelect
                options={accountOptions}
                value={form.account_code}
                onChange={v => setForm(f => ({ ...f, account_code: v }))}
                placeholder="Search account..."
              />
            </FormField>
            <FormField label="Credit Account">
              <SearchableSelect
                options={creditAccountOptions}
                value={form.credit_account_code}
                onChange={v => setForm(f => ({ ...f, credit_account_code: v }))}
                placeholder="Select credit account..."
              />
            </FormField>
          </div>

          {/* Passenger name — can be typed or selected from master */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Passenger Name">
              <Combobox
                options={passengerOptions}
                value={form.passenger_name}
                onChange={v => setForm(f => ({ ...f, passenger_name: v }))}
                placeholder="Type or select passenger..."
              />
              {/* No onNewEntry here — passengers don't need saving to DB */}
            </FormField>
            <FormField label="Driver">
              <SearchableSelect
                options={driverOptions}
                value={form.driver_code}
                onChange={v => setForm(f => ({ ...f, driver_code: v }))}
                placeholder="Select driver..."
              />
            </FormField>
          </div>

          {/* ── SECTION 3: Purpose ── */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Purpose / Destination">
              <Combobox
                options={purposeOptions}
                value={form.purpose}
                onChange={v => setForm(f => ({ ...f, purpose: v }))}
                placeholder="Type or select purpose..."
                onNewEntry={handleNewPurpose}  // saves new entries to DB
              />
            </FormField>
            <FormField label="Additional Notes">
              <Input
                name="purpose_extra"
                value={form.purpose_extra}
                onChange={handleChange}
                placeholder="Additional destination info..."
              />
            </FormField>
          </div>

          {/* ── SECTION 4: Odometer & KM ── */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              Odometer & Distance
            </p>
            <div className="grid grid-cols-4 gap-4">
              <FormField label="Odometer Out">
                <Input
                  type="number"
                  name="odometer_out"
                  value={form.odometer_out}
                  onChange={handleOdometerChange}
                  placeholder="Reading at departure"
                  min={0}
                />
              </FormField>
              <FormField label="Odometer In">
                <Input
                  type="number"
                  name="odometer_in"
                  value={form.odometer_in}
                  onChange={handleOdometerChange}
                  placeholder="Reading at return"
                  min={0}
                />
              </FormField>
              <FormField label="KM Run">
                {/* Editable but also auto-calculated */}
                <Input
                  type="number"
                  name="km_run"
                  value={form.km_run}
                  onChange={handleChange}
                  placeholder="Total km"
                  min={0}
                />
              </FormField>
              <FormField label="Duration (mins)">
                <Input
                  type="number"
                  name="duration_minutes"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  placeholder="Auto-calculated"
                  readOnly  // always auto-calculated
                  className="bg-gray-50"
                />
              </FormField>
            </div>
          </div>

          {/* ── SECTION 5: Times ── */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Departure Time">
              <Input
                type="time"
                name="departure_time"
                value={form.departure_time}
                onChange={handleTimeChange}
              />
            </FormField>
            <FormField label="Arrival Time">
              <Input
                type="time"
                name="arrival_time"
                value={form.arrival_time}
                onChange={handleTimeChange}
              />
            </FormField>
          </div>

          {/* ── SECTION 6: Charge Calculation ── */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              Charge Calculation
            </p>

            {/* Charge method toggle */}
            <div className="flex gap-4 mb-4">
              {/* Radio buttons for charge method */}
              {[
                { value: 'F', label: 'Fixed Rate' },
                { value: 'K', label: 'Per KM' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="charge_method"
                    value={opt.value}
                    checked={form.charge_method === opt.value}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Fixed rate selector — only shown in Fixed mode */}
            {form.charge_method === 'F' && (
              <div className="mb-4">
                <FormField label="Fixed Rate Schedule">
                  <SearchableSelect
                    options={fixedRateOptions}
                    value={form.fixed_rate_code}
                    onChange={handleFixedRateChange}
                    placeholder="Select fare..."
                  />
                </FormField>

                {/* Show extra KM warning when applicable */}
                {charge && charge.extra_km > 0 && (
                  <div className="mt-3 bg-orange-50 border border-orange-200
                                  rounded-md p-3">
                    <p className="text-sm text-orange-800 font-medium">
                      ⚠ Extra {charge.extra_km} km beyond{' '}
                      {selectedFixedRate?.distance_threshold_km}km threshold
                      {institution?.km_margin > 0 &&
                        ` (after ${institution.km_margin}km margin)`}
                    </p>
                    {/* Checkbox to bill or not bill the extra KM */}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="extra_km_billed"
                        checked={form.extra_km_billed}
                        onChange={handleChange}
                        className="h-4 w-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-orange-700">
                        Bill extra km charges
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Override amount — works in both modes */}
            <FormField label="Override Amount (₹) — adds to calculated charge">
              <Input
                type="number"
                name="override_amount"
                value={form.override_amount}
                onChange={handleChange}
                min={0}
                step="0.01"
                placeholder="0.00"
              />
            </FormField>

            {/* Live charge breakdown — updates as user changes values */}
            {charge && (
              <div className="mt-4">
                <ChargeSummary charge={charge} chargeMethod={form.charge_method} />
              </div>
            )}
          </div>

          {/* ── FORM ACTIONS ── */}
          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Trip'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm({ ...emptyForm(), fiscal_year: form.fiscal_year })
                setCharge(null)
                setAlert(null)
              }}
            >
              Reset Form
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}