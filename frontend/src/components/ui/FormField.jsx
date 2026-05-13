// A reusable form field that combines label + input + error message
// Props:
//   label     = text shown above the input
//   error     = validation error message (shown in red if present)
//   children  = the actual input element passed between tags
export default function FormField({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Label above the input */}
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* children = whatever input/select is passed inside this component */}
      {children}

      {/* Only show error text if error prop exists */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}