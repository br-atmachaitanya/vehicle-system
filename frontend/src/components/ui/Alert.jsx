// Shows success or error messages to the user
// type = 'success' | 'error'
export default function Alert({ message, type = 'success', onClose }) {
  if (!message) return null  // render nothing if no message

  const styles = {
    success: 'bg-green-50 border-green-400 text-green-800',
    error:   'bg-red-50 border-red-400 text-red-800',
  }

  return (
    <div className={`border rounded-md px-4 py-3 flex justify-between items-start ${styles[type]}`}>
      <p className="text-sm">{message}</p>

      {/* X button to dismiss the alert */}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-60 hover:opacity-100 font-bold"
        >
          ×
        </button>
      )}
    </div>
  )
}