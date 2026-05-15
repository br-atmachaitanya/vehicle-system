// Renders the JSON report data as a formatted HTML table
// This is what the user sees before printing or downloading PDF

const fmt = (n) => `₹${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

// Status color for certificate register
const statusClass = (status) => ({
  expired: 'text-red-600 font-bold',
  soon:    'text-orange-500 font-semibold',
  ok:      'text-gray-700',
  missing: 'text-gray-400 italic',
}[status] || '')

function TableHeader({ cols }) {
  return (
    <thead>
      <tr className="bg-blue-900 text-white">
        {cols.map((col, i) => (
          <th key={i} className="px-3 py-2 text-left text-xs font-semibold">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function ReportHeader({ data }) {
  return (
    // print:text-black ensures colours print correctly
    <div className="text-center mb-6 print:mb-4">
      <h2 className="text-xl font-bold text-gray-800">{data.institution}</h2>
      <h3 className="text-lg font-semibold text-gray-700 mt-1">{data.title}</h3>
      {data.date_from && (
        <p className="text-sm text-gray-500 mt-1">
          From {data.date_from} to {data.date_to}
        </p>
      )}
      {data.credit_name && (
        <p className="text-sm text-blue-700 font-medium mt-1">
          Credit to: {data.credit_name}
        </p>
      )}
      {data.as_of_date && (
        <p className="text-sm text-gray-500 mt-1">As of {data.as_of_date}</p>
      )}
    </div>
  )
}

// Renders account bill or credit bill (same structure)
function BillReport({ data }) {
  return (
    <div>
      <ReportHeader data={data} />
      {data.groups.map((group, gi) => (
        <div key={gi} className="mb-6">
          <h4 className="font-semibold text-gray-700 text-sm mb-2 bg-gray-100
                          px-3 py-1.5 rounded">
            {group.account_code} — {group.account_name}
          </h4>
          <table className="w-full text-xs border-collapse">
            <TableHeader cols={["Date","Vehicle","Passenger","Purpose","KM","Amount (₹)"]} />
            <tbody>
              {group.trips.map((trip, ti) => (
                <tr key={ti}
                    className={ti % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                  <td className="px-3 py-1.5 border border-gray-200">{trip.date}</td>
                  <td className="px-3 py-1.5 border border-gray-200">{trip.vehicle}</td>
                  <td className="px-3 py-1.5 border border-gray-200">{trip.passenger}</td>
                  <td className="px-3 py-1.5 border border-gray-200">{trip.purpose}</td>
                  <td className="px-3 py-1.5 border border-gray-200 text-right">{trip.km_run}</td>
                  <td className="px-3 py-1.5 border border-gray-200 text-right font-medium">
                    {fmt(trip.amount)}
                  </td>
                </tr>
              ))}
              {/* Subtotal row */}
              <tr className="bg-blue-100 font-semibold">
                <td colSpan={5} className="px-3 py-1.5 border border-gray-200 text-right">
                  Subtotal:
                </td>
                <td className="px-3 py-1.5 border border-gray-200 text-right">
                  {fmt(group.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* Grand total */}
      <div className="text-right mt-4 pt-3 border-t-2 border-gray-800">
        <span className="text-base font-bold">
          Grand Total: {fmt(data.grand_total)}
        </span>
      </div>
    </div>
  )
}

function LogBookReport({ data }) {
  const isDriver = data.report_type === 'driver_log_book'
  const cols = isDriver
    ? ["Date","Passenger","Purpose","KM Out","KM In","KM Run","Dep","Arr","Dur(min)","Vehicle"]
    : ["Date","Passenger","Purpose","KM Out","KM In","KM Run","Dep","Arr","Account","Driver"]

  return (
    <div>
      <ReportHeader data={data} />
      <p className="text-sm font-semibold text-gray-700 mb-3">
        {isDriver
          ? `Driver: ${data.driver_name}`
          : `Vehicle: ${data.vehicle_name}`}
      </p>
      <table className="w-full text-xs border-collapse">
        <TableHeader cols={cols} />
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
              <td className="px-2 py-1.5 border border-gray-200">{row.date}</td>
              <td className="px-2 py-1.5 border border-gray-200">{row.passenger}</td>
              <td className="px-2 py-1.5 border border-gray-200">{row.purpose}</td>
              <td className="px-2 py-1.5 border border-gray-200 text-right">{row.km_out}</td>
              <td className="px-2 py-1.5 border border-gray-200 text-right">{row.km_in}</td>
              <td className="px-2 py-1.5 border border-gray-200 text-right font-medium">{row.km_run}</td>
              <td className="px-2 py-1.5 border border-gray-200">{row.dep_time}</td>
              <td className="px-2 py-1.5 border border-gray-200">{row.arr_time}</td>
              <td className="px-2 py-1.5 border border-gray-200">
                {isDriver ? row.duration : row.account}
              </td>
              <td className="px-2 py-1.5 border border-gray-200">
                {isDriver ? row.vehicle : row.driver}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-sm font-semibold text-gray-700">
        Total KM: {data.total_km}
        {isDriver && ` | Total Duration: ${data.total_duration} min`}
      </div>
    </div>
  )
}

function IncomeExpenditureReport({ data }) {
  return (
    <div>
      <ReportHeader data={data} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <TableHeader cols={[
            "Vehicle","KM","Income","Fuel(L)","Fuel(₹)",
            "Repair","Misc","Total Exp","Net","KM/L"
          ]} />
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                <td className="px-2 py-1.5 border border-gray-200">{row.vehicle_name}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{row.total_km}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{fmt(row.total_income)}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{row.fuel_qty}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{fmt(row.fuel_cost)}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{fmt(row.repair)}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{fmt(row.misc)}</td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{fmt(row.total_expense)}</td>
                <td className={`px-2 py-1.5 border border-gray-200 text-right font-semibold
                  ${row.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {fmt(row.net)}
                </td>
                <td className="px-2 py-1.5 border border-gray-200 text-right">{row.km_per_litre}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-blue-900 text-white font-bold">
              <td className="px-2 py-2 border border-blue-700">TOTAL</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{data.totals.total_km}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{fmt(data.totals.total_income)}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{data.totals.fuel_qty}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{fmt(data.totals.fuel_cost)}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{fmt(data.totals.repair)}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{fmt(data.totals.misc)}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{fmt(data.totals.total_expense)}</td>
              <td className="px-2 py-2 border border-blue-700 text-right">{fmt(data.totals.net)}</td>
              <td className="px-2 py-2 border border-blue-700">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CertificateReport({ data }) {
  return (
    <div>
      <ReportHeader data={data} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <TableHeader cols={[
            "Vehicle","Reg No","Road Tax","Insurance",
            "Fitness","Permit","PUC","VS Toll","Howrah Stn","Sealdah Stn"
          ]} />
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                <td className="px-2 py-1.5 border border-gray-200 font-medium">{row.description}</td>
                <td className="px-2 py-1.5 border border-gray-200">{row.reg_number}</td>
                {["road_tax","insurance","fitness","permit","puc",
                  "vs_toll","howrah_stn","sealdah_stn"].map(field => (
                  <td key={field}
                      className={`px-2 py-1.5 border border-gray-200 ${statusClass(row[field].status)}`}>
                    {row[field].date}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs">
        <span className="text-red-600 font-bold">● Expired</span>
        <span className="text-orange-500 font-semibold">● Expiring within 30 days</span>
        <span className="text-gray-700">● Valid</span>
      </div>
    </div>
  )
}

// Main dispatcher — picks the right component based on report_type
export default function ReportViewer({ data }) {
  if (!data) return null

  // Print-only styles — hides everything except the report
  const printStyles = `
    @media print {
      body > * { display: none !important; }
      #report-print-area { display: block !important; }
      #report-print-area { position: fixed; top: 0; left: 0; width: 100%; }
    }
  `

  const renderReport = () => {
    switch (data.report_type) {
      case 'account_bill':
      case 'credit_bill':
        return <BillReport data={data} />
      case 'log_book':
      case 'driver_log_book':
        return <LogBookReport data={data} />
      case 'income_expenditure':
        return <IncomeExpenditureReport data={data} />
      case 'certificate_register':
        return <CertificateReport data={data} />
      default:
        return <p className="text-gray-400">Unknown report type</p>
    }
  }

  return (
    <>
      {/* Inject print CSS */}
      <style>{printStyles}</style>

      <div
        id="report-print-area"
        className="bg-white rounded-lg shadow-sm p-8 print:shadow-none print:p-0"
      >
        {renderReport()}
      </div>
    </>
  )
}