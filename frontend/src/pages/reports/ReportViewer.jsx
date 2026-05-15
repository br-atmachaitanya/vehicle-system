import { useRef } from 'react'

const fmt = (n) => `Rs. ${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

const statusClass = (status) => ({
  expired: 'color: red; font-weight: bold;',
  soon:    'color: orange; font-weight: bold;',
  ok:      '',
  missing: 'color: #aaa; font-style: italic;',
}[status] || '')

// ── Sub-components ────────────────────────────────────────────────────────────

function TableHeader({ cols }) {
  return (
    <thead>
      <tr style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
        {cols.map((col, i) => (
          <th key={i} style={{
            padding: '6px 8px', textAlign: 'left',
            fontSize: '11px', fontWeight: '600',
            borderBottom: '2px solid #1e3a5f',
          }}>
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function ReportHeader({ data }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px' }}>
        {data.institution}
      </h2>
      <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>
        {data.title}
      </h3>
      {data.date_from && (
        <p style={{ fontSize: '12px', color: '#555', margin: '0 0 4px' }}>
          From {data.date_from} to {data.date_to}
        </p>
      )}
      {data.credit_name && (
        <p style={{ fontSize: '12px', color: '#1e3a5f', fontWeight: '500', margin: 0 }}>
          Credit to: {data.credit_name}
        </p>
      )}
      {data.as_of_date && (
        <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
          As of {data.as_of_date}
        </p>
      )}
    </div>
  )
}

// Shared table styles
const tdStyle = (i) => ({
  padding: '5px 8px',
  fontSize: '11px',
  borderBottom: '1px solid #e0e0e0',
  backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff',
  verticalAlign: 'top',      // top-align for wrapped text
  wordBreak: 'break-word',   // wrap long words
})

const tdRight = (i) => ({ ...tdStyle(i), textAlign: 'right' })

// ── Report Components ─────────────────────────────────────────────────────────

function BillReport({ data }) {
  return (
    <div>
      <ReportHeader data={data} />
      {data.groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '12px', fontWeight: '600',
            backgroundColor: '#e8f0fe', padding: '6px 8px',
            margin: '0 0 4px', borderLeft: '3px solid #1e3a5f'
          }}>
            {group.account_code} — {group.account_name}
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHeader cols={["Date","Vehicle","Passenger","Purpose","KM","Amount (Rs. )"]} />
            <tbody>
              {group.trips.map((trip, ti) => (
                <tr key={ti}>
                  <td style={{ ...tdStyle(ti), whiteSpace: 'nowrap', width: '70px' }}>
                    {trip.date}
                  </td>
                  <td style={{ ...tdStyle(ti), width: '120px' }}>{trip.vehicle}</td>
                  <td style={{ ...tdStyle(ti), width: '130px' }}>{trip.passenger}</td>
                  <td style={{ ...tdStyle(ti) }}>{trip.purpose}</td>
                  <td style={{ ...tdRight(ti), width: '50px' }}>{trip.km_run}</td>
                  <td style={{ ...tdRight(ti), width: '80px', fontWeight: '500' }}>
                    {fmt(trip.amount)}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#dbeafe' }}>
                <td colSpan={5} style={{
                  padding: '5px 8px', textAlign: 'right',
                  fontSize: '11px', fontWeight: '600'
                }}>
                  Subtotal:
                </td>
                <td style={{
                  padding: '5px 8px', textAlign: 'right',
                  fontSize: '11px', fontWeight: '600'
                }}>
                  {fmt(group.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      <div style={{
        textAlign: 'right', marginTop: '12px',
        paddingTop: '8px', borderTop: '2px solid #1e3a5f',
        fontSize: '14px', fontWeight: 'bold'
      }}>
        Grand Total: {fmt(data.grand_total)}
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
      <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
        {isDriver ? `Driver: ${data.driver_name}` : `Vehicle: ${data.vehicle_name}`}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <TableHeader cols={cols} />
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle(i), whiteSpace: 'nowrap', width: '70px' }}>
                {row.date}
              </td>
              <td style={{ ...tdStyle(i), width: '110px' }}>{row.passenger}</td>
              <td style={{ ...tdStyle(i) }}>{row.purpose}</td>
              <td style={{ ...tdRight(i), width: '55px' }}>{row.km_out}</td>
              <td style={{ ...tdRight(i), width: '55px' }}>{row.km_in}</td>
              <td style={{ ...tdRight(i), width: '50px', fontWeight: '500' }}>
                {row.km_run}
              </td>
              <td style={{ ...tdStyle(i), width: '45px' }}>{row.dep_time}</td>
              <td style={{ ...tdStyle(i), width: '45px' }}>{row.arr_time}</td>
              <td style={{ ...tdStyle(i), width: isDriver ? '55px' : '100px' }}>
                {isDriver ? row.duration : row.account}
              </td>
              <td style={{ ...tdStyle(i) }}>
                {isDriver ? row.vehicle : row.driver}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: '600' }}>
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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <TableHeader cols={[
          "Vehicle", "KM", "Income (Rs. )",
          "Fuel (L)", "Fuel (Rs. )", "Repair (Rs. )",
          "Misc (Rs. )", "Total Exp (Rs. )", "Net (Rs. )", "KM/L"
        ]} />
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle(i) }}>{row.vehicle_name}</td>
              <td style={{ ...tdRight(i), width: '50px' }}>{row.total_km}</td>
              <td style={{ ...tdRight(i), width: '80px' }}>{fmt(row.total_income)}</td>
              <td style={{ ...tdRight(i), width: '55px' }}>{row.fuel_qty}</td>
              <td style={{ ...tdRight(i), width: '75px' }}>{fmt(row.fuel_cost)}</td>
              <td style={{ ...tdRight(i), width: '75px' }}>{fmt(row.repair)}</td>
              <td style={{ ...tdRight(i), width: '70px' }}>{fmt(row.misc)}</td>
              <td style={{ ...tdRight(i), width: '80px' }}>{fmt(row.total_expense)}</td>
              <td style={{
                ...tdRight(i), width: '80px', fontWeight: '600',
                color: row.net >= 0 ? '#15803d' : '#dc2626'
              }}>
                {fmt(row.net)}
              </td>
              <td style={{ ...tdRight(i), width: '45px' }}>{row.km_per_litre}</td>
            </tr>
          ))}
          {/* Totals row */}
          <tr style={{ backgroundColor: '#1e3a5f', color: 'white', fontWeight: 'bold' }}>
            <td style={{ padding: '6px 8px', fontSize: '11px' }}>TOTAL</td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {data.totals.total_km}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {fmt(data.totals.total_income)}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {data.totals.fuel_qty}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {fmt(data.totals.fuel_cost)}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {fmt(data.totals.repair)}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {fmt(data.totals.misc)}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {fmt(data.totals.total_expense)}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'right' }}>
              {fmt(data.totals.net)}
            </td>
            <td style={{ padding: '6px 8px', fontSize: '11px' }}>—</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function CertificateReport({ data }) {
  return (
    <div>
      <ReportHeader data={data} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHeader cols={[
            "Vehicle", "Reg No", "Road Tax", "Insurance",
            "Fitness", "Permit", "PUC", "VS Toll",
            "Howrah Stn", "Sealdah Stn"
          ]} />
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle(i), fontWeight: '500' }}>
                  {row.description}
                </td>
                <td style={{ ...tdStyle(i), fontFamily: 'monospace', fontSize: '10px' }}>
                  {row.reg_number}
                </td>
                {["road_tax","insurance","fitness","permit",
                  "puc","vs_toll","howrah_stn","sealdah_stn"].map(field => (
                  <td key={field} style={{
                    ...tdStyle(i),
                    fontSize: '10px',
                    // inline style for status color
                    ...(row[field].status === 'expired'
                      ? { color: 'red', fontWeight: 'bold' }
                      : row[field].status === 'soon'
                      ? { color: 'orange', fontWeight: '600' }
                      : row[field].status === 'missing'
                      ? { color: '#aaa', fontStyle: 'italic' }
                      : {})
                  }}>
                    {row[field].date}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '10px', fontSize: '11px', display: 'flex', gap: '16px' }}>
        <span style={{ color: 'red', fontWeight: 'bold' }}>● Expired</span>
        <span style={{ color: 'orange', fontWeight: '600' }}>
          ● Expiring within 30 days
        </span>
        <span>● Valid</span>
      </div>
    </div>
  )
}

// ── Main ReportViewer ─────────────────────────────────────────────────────────

export default function ReportViewer({ data, onPrint }) {
  // Store ref to the rendered HTML for the print window
  const reportRef = useRef(null)

  // Expose print function to parent via callback
  // Called when user clicks Print button in ReportsPage
  if (onPrint) {
    // We attach the print handler to the ref so parent can call it
    onPrint.current = () => {
      if (!reportRef.current) return

      // Get the inner HTML of the report
      const html = reportRef.current.innerHTML

      // Determine orientation based on report type
      const isLandscape = [
        'log_book', 'driver_log_book',
        'income_expenditure', 'certificate_register'
      ].includes(data.report_type)

      // Open a new blank window
      const printWindow = window.open('', '_blank', 'width=1000,height=700')

      // Write a complete HTML document into it
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${data.title || 'Report'}</title>
            <style>
              /* Reset */
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                font-size: 11px;
                color: #000;
                padding: 15mm;
              }

              /* Print page setup */
              @page {
                size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
                margin: 15mm;
              }

              /* Tables */
              table { width: 100%; border-collapse: collapse; }
              th {
                background-color: #1e3a5f !important;
                color: white !important;
                padding: 5px 7px;
                font-size: 10px;
                text-align: left;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              td {
                padding: 4px 7px;
                font-size: 10px;
                border-bottom: 1px solid #ddd;
                vertical-align: top;
                word-break: break-word;
              }
              tr:nth-child(even) td { background-color: #f0f4ff; }

              /* Section headers */
              h4 {
                background-color: #e8f0fe !important;
                padding: 5px 8px;
                margin: 12px 0 4px;
                font-size: 11px;
                border-left: 3px solid #1e3a5f;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              /* Page breaks */
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `)

      printWindow.document.close()

      // Wait for content to render before printing
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        // Close the window after print dialog closes
        printWindow.onafterprint = () => printWindow.close()
      }
    }
  }

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
        return <p style={{ color: '#aaa' }}>Unknown report type</p>
    }
  }

  return (
    <div
      ref={reportRef}
      className="bg-white rounded-lg shadow-sm p-8"
    >
      {renderReport()}
    </div>
  )
}