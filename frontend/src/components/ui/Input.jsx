// Reusable styled input — keeps our input styling consistent everywhere
// ...props spreads all other props (value, onChange, type, placeholder etc)
// This way we don't have to explicitly list every possible HTML input attribute
export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-100 disabled:text-gray-500
        ${className}
      `}
      {...props}  // passes value, onChange, type, placeholder etc through
    />
  )
}