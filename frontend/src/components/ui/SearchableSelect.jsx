import { useState, useEffect, useRef } from 'react'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Search or select...',
  disabled = false,
}) {
  const [searchText, setSearchText]   = useState('')
  const [open, setOpen]               = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef(null)
  const searchRef    = useRef(null)
  const listRef      = useRef(null)

  const selectedLabel = options.find(o => o.value === value)?.label || ''

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(searchText.toLowerCase())
  )

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearchText('')
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setOpen(false)
    setSearchText('')
    setHighlighted(-1)
  }

  const scrollIntoView = (index) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]')
      items[index]?.scrollIntoView({ block: 'nearest' })
    }
  }

  // Keyboard handler for the search input inside the dropdown
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted(h => {
          const next = Math.min(h + 1, filtered.length - 1)
          scrollIntoView(next)
          return next
        })
        break

      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => {
          const prev = Math.max(h - 1, 0)
          scrollIntoView(prev)
          return prev
        })
        break

      case 'Enter':
        e.preventDefault()
        if (highlighted >= 0 && highlighted < filtered.length) {
          handleSelect(filtered[highlighted].value)
        } else if (filtered.length === 1) {
          // Auto-select when only one match
          handleSelect(filtered[0].value)
        }
        break

      case 'Escape':
        setOpen(false)
        setSearchText('')
        setHighlighted(-1)
        break

      case 'Tab':
        // Tab away commits the first match or closes
        if (filtered.length === 1) {
          handleSelect(filtered[0].value)
        } else {
          setOpen(false)
          setSearchText('')
        }
        break

      default:
        break
    }
  }

  // Allow Tab to open the dropdown (keyboard-only users)
  const handleButtonKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div ref={containerRef} className="relative">

      {/* Trigger button — focusable via Tab key */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleButtonKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                   text-left bg-white focus:outline-none focus:ring-2
                   focus:ring-blue-500 disabled:bg-gray-100
                   flex justify-between items-center"
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <span className={`transition-transform text-xs ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200
                        rounded-md shadow-lg">

          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value)
                setHighlighted(-1)  // reset highlight on new search
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type to search... (↑↓ to navigate, Enter to select)"
              className="w-full px-2 py-1 text-sm border border-gray-300
                         rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Options list */}
          <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">

            {/* Clear option */}
            <li
              data-item
              onMouseDown={(e) => { e.preventDefault(); handleSelect('') }}
              className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50
                         cursor-pointer italic"
            >
              — Clear selection —
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No results</li>
            ) : (
              filtered.map((o, index) => (
                <li
                  key={o.value}
                  data-item
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(o.value) }}
                  className={`
                    px-3 py-2 text-sm cursor-pointer
                    ${index === highlighted
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-blue-50 text-gray-800'}
                  `}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>

          {/* Keyboard hint at bottom */}
          <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400">
            ↑↓ navigate &nbsp;·&nbsp; Enter select &nbsp;·&nbsp; Esc close
          </div>
        </div>
      )}
    </div>
  )
}