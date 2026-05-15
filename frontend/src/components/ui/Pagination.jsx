// Simple pagination component
// Props:
//   page      = current page (1-indexed)
//   totalPages = total number of pages
//   onChange  = called with new page number
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null  // no pagination needed for single page

  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>

      {/* Page numbers — show window of 5 around current page */}
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages ||
                     (p >= page - 2 && p <= page + 2))
        .reduce((acc, p, i, arr) => {
          // Insert ellipsis when there are gaps
          if (i > 0 && p - arr[i - 1] > 1) {
            acc.push('...')
          }
          acc.push(p)
          return acc
        }, [])
        .map((p, i) => (
          p === '...'
            ? <span key={`e${i}`} className="text-gray-400 px-1">…</span>
            : <button
                key={p}
                onClick={() => onChange(p)}
                className={`px-3 py-1 rounded text-sm
                  ${p === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {p}
              </button>
        ))
      }

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  )
}