// variant = 'primary' | 'secondary' | 'danger'
// Defaults to primary if not specified
export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props  // passes onClick, type, disabled etc through
}) {
  // Define style for each variant
  const variants = {
    primary:   'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50',
    danger:    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  }

  return (
    <button
      className={`
        px-4 py-2 rounded-md text-sm font-medium transition-colors
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}