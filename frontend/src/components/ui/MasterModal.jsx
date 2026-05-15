// A slide-in modal for create/edit forms
// Props:
//   open     = boolean, whether modal is visible
//   onClose  = function to close
//   title    = modal header text
//   children = form content
export default function MasterModal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    // Overlay — clicking outside closes modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black bg-opacity-40"
      onMouseDown={(e) => {
        // Only close if clicking the overlay itself, not the modal content
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal box */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl
                      max-h-[90vh] overflow-y-auto mx-4">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4
                        border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}