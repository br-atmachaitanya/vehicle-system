import { useState, useEffect, useRef } from 'react'
import { vehicleApi, driverApi, creditAccountApi, accountApi } from '../../api'
import { reportsApi } from '../../api/reports'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ReportViewer from './ReportViewer'

// Report type definitions — drives the parameter form
const REPORT_TYPES = [
  {
    id:     'account-bill',
    label:  'Account Bill',
    desc:   'Monthly charge statement per department',
    params: ['date_from', 'date_to', 'account_code_optional'],
  },
  {
    id:     'credit-bill',
    label:  'Credit Bill',
    desc:   'Trips grouped by credit account',
    params: ['date_from', 'date_to', 'credit_code'],
  },
  {
    id:     'log-book',
    label:  'Vehicle Log Book',
    desc:   'All trips for a vehicle in date range',
    params: ['date_from', 'date_to', 'vehicle_code'],
  },
  {
    id:     'driver-log-book',
    label:  'Driver Log Book',
    desc:   'All trips by a driver in date range',
    params: ['date_from', 'date_to', 'driver_code'],
  },
  {
    id:     'income-expenditure',
    label:  'Income vs Expenditure',
    desc:   'Vehicle-wise financial summary',
    params: ['date_from', 'date_to'],
  },
  {
    id:     'certificate-register',
    label:  'Certificate Register',
    desc:   'All vehicle compliance dates',
    params: [],   // no parameters needed
  },
]

// Map API endpoint names
const ENDPOINT_MAP = {
  'account-bill':        'account-bill',
  'credit-bill':         'credit-bill',
  'log-book':            'log-book',
  'driver-log-book':     'driver-log-book',
  'income-expenditure':  'income-expenditure',
  'certificate-register':'certificate-register',
}

// Map report type to API function
const API_MAP = {
  'account-bill':         (p) => reportsApi.accountBill(p),
  'credit-bill':          (p) => reportsApi.creditBill(p),
  'log-book':             (p) => reportsApi.logBook(p),
  'driver-log-book':      (p) => reportsApi.driverLogBook(p),
  'income-expenditure':   (p) => reportsApi.incomeExpenditure(p),
  'certificate-register': (p) => reportsApi.certificateRegister(p),
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState(null)
  const [params, setParams]             = useState({
    date_from: '',
    date_to: '',
    account_code: '',
    credit_code: '',
    vehicle_code: '',
    driver_code: '',
  })
  const [loading, setLoading]     = useState(false)
  const [reportData, setReportData] = useState(null)
  const [alert, setAlert]         = useState(null)
  
  const printFnRef = useRef(null)
  // Master data for dropdowns
  const [vehicles, setVehicles]             = useState([])
  const [drivers, setDrivers]               = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [accounts, setAccounts]             = useState([])

  useEffect(() => {
    Promise.all([
      vehicleApi.list(),
      driverApi.list(),
      creditAccountApi.list(),
      accountApi.list(),
    ]).then(([v, d, cr, a]) => {
      setVehicles(v.data)
      setDrivers(d.data)
      setCreditAccounts(cr.data)
      setAccounts(a.data)
    })
  }, [])

  const handleParamChange = (name, value) => {
    setParams(prev => ({ ...prev, [name]: value }))
  }

  const buildApiParams = () => {
    const p = {}
    const type = selectedType

    if (type.params.includes('date_from'))             p.date_from    = params.date_from
    if (type.params.includes('date_to'))               p.date_to      = params.date_to
    if (type.params.includes('account_code_optional') && params.account_code)
                                                       p.account_code = params.account_code
    if (type.params.includes('credit_code'))           p.credit_code  = params.credit_code
    if (type.params.includes('vehicle_code'))          p.vehicle_code = params.vehicle_code
    if (type.params.includes('driver_code'))           p.driver_code  = params.driver_code
    return p
  }

  const handleGenerate = async () => {
    setAlert(null)
    setReportData(null)

    // ── Validate required parameters before hitting API ──
    const type = selectedType
    const errors = []

    if (type.params.includes('date_from') && !params.date_from) {
      errors.push('From Date is required')
    }
    if (type.params.includes('date_to') && !params.date_to) {
      errors.push('To Date is required')
    }
    if (type.params.includes('credit_code') && !params.credit_code) {
      errors.push('Credit Account is required')
    }
    if (type.params.includes('vehicle_code') && !params.vehicle_code) {
      errors.push('Vehicle is required')
    }
    if (type.params.includes('driver_code') && !params.driver_code) {
      errors.push('Driver is required')
    }
    if (params.date_from && params.date_to && params.date_from > params.date_to) {
      errors.push('From Date must be before To Date')
    }

    if (errors.length > 0) {
      setAlert({ message: errors.join(' · '), type: 'error' })
      return   // stop here — don't call API
    }

    setLoading(true)
    try {
      const apiParams = buildApiParams()
      const r = await API_MAP[selectedType.id](apiParams)
      setReportData(r.data)
    } catch (err) {
      // Use the readable message we extracted in client.js
      setAlert({
        message: err.readableMessage || 'Failed to generate report.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }
  const handlePrint = () => {
    if (printFnRef.current) {
      printFnRef.current()   // calls the function ReportViewer attached
    }
  }
  const handleDownloadPdf = async () => {
    setLoading(true)
    try {
      const apiParams = buildApiParams()
      const r = await reportsApi.downloadPdf(
        ENDPOINT_MAP[selectedType.id],
        apiParams
      )
      const url  = window.URL.createObjectURL(new Blob([r.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download',
        `${selectedType.id}_${params.date_from || 'all'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setAlert({
        message: err.readableMessage || 'PDF generation failed.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const vehicleOptions      = vehicles.map(v => ({ value: v.code, label: `${v.code} — ${v.description}` }))
  const driverOptions       = drivers.map(d => ({ value: d.code, label: d.name }))
  const creditAccountOptions= creditAccounts.map(c => ({ value: c.code, label: c.name }))
  const accountOptions      = accounts.map(a => ({ value: a.code, label: `${a.code} — ${a.name}` }))

  return (
    <div className="space-y-6">

      {/* Report type selector */}
      {!selectedType ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Select Report
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {REPORT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type); setReportData(null) }}
                className="bg-white rounded-lg shadow-sm p-5 text-left
                           border-2 border-transparent hover:border-blue-500
                           transition-colors"
              >
                <p className="font-semibold text-gray-800">{type.label}</p>
                <p className="text-sm text-gray-500 mt-1">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedType(null); setReportData(null) }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back
            </button>
            <h3 className="text-lg font-semibold text-gray-700">
              {selectedType.label}
            </h3>
          </div>

          {alert && (
            <Alert message={alert.message} type={alert.type}
                   onClose={() => setAlert(null)} />
          )}

          {/* Parameter form */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="grid grid-cols-3 gap-4">

              {selectedType.params.includes('date_from') && (
                <FormField label="From Date *">
                  <Input type="date" value={params.date_from}
                         onChange={e => handleParamChange('date_from', e.target.value)} />
                </FormField>
              )}

              {selectedType.params.includes('date_to') && (
                <FormField label="To Date *">
                  <Input type="date" value={params.date_to}
                         onChange={e => handleParamChange('date_to', e.target.value)} />
                </FormField>
              )}

              {selectedType.params.includes('account_code_optional') && (
                <FormField label="Account (leave blank for all)">
                  <SearchableSelect
                    options={accountOptions}
                    value={params.account_code}
                    onChange={v => handleParamChange('account_code', v)}
                    placeholder="All accounts..."
                  />
                </FormField>
              )}

              {selectedType.params.includes('credit_code') && (
                <FormField label="Credit Account *">
                  <SearchableSelect
                    options={creditAccountOptions}
                    value={params.credit_code}
                    onChange={v => handleParamChange('credit_code', v)}
                    placeholder="Select..."
                  />
                </FormField>
              )}

              {selectedType.params.includes('vehicle_code') && (
                <FormField label="Vehicle *">
                  <SearchableSelect
                    options={vehicleOptions}
                    value={params.vehicle_code}
                    onChange={v => handleParamChange('vehicle_code', v)}
                    placeholder="Select vehicle..."
                  />
                </FormField>
              )}

              {selectedType.params.includes('driver_code') && (
                <FormField label="Driver *">
                  <SearchableSelect
                    options={driverOptions}
                    value={params.driver_code}
                    onChange={v => handleParamChange('driver_code', v)}
                    placeholder="Select driver..."
                  />
                </FormField>
              )}

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Preview Report'}
            </Button>
            {reportData && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleDownloadPdf}
                  disabled={loading}
                >
                  ⬇ Download PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePrint}
                >
                  🖨 Print
                </Button>
              </>
            )}
          </div>

          {/* Report preview */}
          {reportData && (
            <ReportViewer
              data={reportData}
              onPrint={printFnRef}
            />
          )}
        </div>
      )}
    </div>
  )
}