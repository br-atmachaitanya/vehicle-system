// Displays the charge calculation breakdown
// Props mirror the calculate-charge API response
export default function ChargeSummary({ charge, chargeMethod }) {
  if (!charge) return null

  // Format number as Indian currency string
  const fmt = (n) => `₹${Number(n).toFixed(2)}`

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-1">
      <p className="text-sm font-semibold text-blue-800 mb-2">Charge Breakdown</p>

      {/* Show fixed rate line only in fixed mode */}
      {chargeMethod === 'F' && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fixed Rate Amount</span>
          <span className="font-medium">{fmt(charge.fixed_rate_amount)}</span>
        </div>
      )}

      {/* Show per-km info in per-km mode */}
      {chargeMethod === 'K' && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Per KM Charge</span>
          <span className="font-medium">{fmt(charge.total_charge - charge.override_amount)}</span>
        </div>
      )}

      {/* Extra KM — only show if there are extra KMs */}
      {charge.extra_km > 0 && (
        <div className="flex justify-between text-sm">
          <span className={charge.extra_km_billed ? 'text-orange-600' : 'text-gray-400'}>
            Extra KM ({charge.extra_km} km)
            {!charge.extra_km_billed && ' — not billed'}
          </span>
          <span className={charge.extra_km_billed ? 'text-orange-600 font-medium' : 'text-gray-400'}>
            {charge.extra_km_billed ? fmt(charge.extra_km_charge) : '—'}
          </span>
        </div>
      )}

      {/* Override amount */}
      {charge.override_amount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Override Amount</span>
          <span className="font-medium">{fmt(charge.override_amount)}</span>
        </div>
      )}

      {/* Total — prominent */}
      <div className="flex justify-between text-base font-bold
                      border-t border-blue-200 pt-2 mt-2">
        <span className="text-blue-900">Total Charge</span>
        <span className="text-blue-900">{fmt(charge.total_charge)}</span>
      </div>
    </div>
  )
}