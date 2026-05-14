import { useState, useEffect, useRef } from 'react'

// Props:
//   options      = array of { value, label } objects
//   value        = current value (string)
//   onChange     = called with new value string
//   placeholder  = hint text
//   disabled     = disables control
//   onNewEntry   = optional callback when user confirms a NEW entry not in list
//                  if provided, shows "Add: xyz" option at bottom of dropdown
export default function Combobox({
  options = [],
  value = '',
  onChange,
  placeholder = 'Type or select...',
  disabled = false,
  onNewEntry = null,
}) {
  // inputText = what's currently typed in the text box
  // Starts as the current value's label (or the value itself for free text)
  const [inputText, setInputText]     = useState(value || '')
  const [open, setOpen]               = useState(false)
  const [highlighted, setHighlighted] = useState(-1) // keyboard navigation index
  const containerRef = useRef(null)
  const inputRef     = useRef(null)
  const listRef      = useRef(null)

  // Sync inputText when value changes externally (e.g. form reset)
  useEffect(() => {
    const label = options.find(o => o.value === value)?.label
    setInputText(label || value || '')
  }, [value, options])

  // Filter options based on what user typed
  const filtered = inputText.trim() === ''
    ? options  // show all when input is empty
    : options.filter(o =>
        o.label.toLowerCase().includes(inputText.toLowerCase())
      )

  // Is the current inputText a new entry (not in options)?
  const isNewEntry = inputText.trim() !== ''
    && !options.some(o =>
        o.label.toLowerCase() === inputText.toLowerCase()
      )

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleBlur()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [inputText, filtered])

  // When user leaves the field — commit whatever is typed
  const handleBlur = () => {
    setOpen(false)
    setHighlighted(-1)

    if (inputText.trim() === '') {
      // User cleared the field
      onChange('')
      return
    }

    // Check if typed text exactly matches an option
    const exactMatch = options.find(
      o => o.label.toLowerCase() === inputText.toLowerCase()
    )

    if (exactMatch) {
      // Snap to the matched option's value
      onChange(exactMatch.value)
      setInputText(exactMatch.label)
    } else {
      // Free text entry — use the typed text as the value directly
      onChange(inputText.trim())
    }
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    setOpen(true)       // open dropdown as user types
    setHighlighted(-1)  // reset keyboard highlight
    // Don't call onChange yet — wait until selection or blur
  }

  const handleSelect = (option) => {
    setInputText(option.label)
    onChange(option.value)
    setOpen(false)
    setHighlighted(-1)
  }

  const handleAddNew = () => {
    const newValue = inputText.trim()
    if (!newValue) return
    if (onNewEntry) onNewEntry(newValue)   // tell parent to save it
    onChange(newValue)                     // set it as the current value
    setOpen(false)
  }

  // ── Keyboard Navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open && e.key !== 'Tab') {
      setOpen(true)  // open on any key except Tab
    }

    const totalItems = filtered.length + (onNewEntry && isNewEntry ? 1 : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()  // prevent page scroll
        setHighlighted(h => Math.min(h + 1, totalItems - 1))
        scrollHighlightedIntoView()
        break

      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => Math.max(h - 1, 0))
        scrollHighlightedIntoView()
        break

      case 'Enter':
        e.preventDefault()
        if (highlighted >= 0 && highlighted < filtered.length) {
          // Select highlighted option
          handleSelect(filtered[highlighted])
        } else if (highlighted === filtered.length && onNewEntry && isNewEntry) {
          // "Add new" item is highlighted
          handleAddNew()
        } else if (filtered.length === 1) {
          // Only one option — auto-select it
          handleSelect(filtered[0])
        } else if (isNewEntry && onNewEntry) {
          handleAddNew()
        }
        break

      case 'Escape':
        setOpen(false)
        setHighlighted(-1)
        inputRef.current?.blur()
        break

      case 'Tab':
        // Tab should commit and move to next field
        handleBlur()
        break

      default:
        break
    }
  }

  // Scroll the highlighted item into view inside the list
  const scrollHighlightedIntoView = () => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]')
      if (items[highlighted]) {
        items[highlighted].scrollIntoView({ block: 'nearest' })
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">

      {/* Text input — user types here */}
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   disabled:bg-gray-100 disabled:text-gray-400"
        autoComplete="off"  // disable browser autocomplete — we have our own
      />

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200
                        rounded-md shadow-lg">
          <ul
            ref={listRef}
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 && !isNewEntry && (
              <li className="px-3 py-2 text-sm text-gray-400 italic">
                No matches found
              </li>
            )}

            {/* Existing options */}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                data-item  // used by scrollHighlightedIntoView
                onMouseDown={(e) => {
                  e.preventDefault()  // prevent blur before click registers
                  handleSelect(option)
                }}
                className={`
                  px-3 py-2 text-sm cursor-pointer
                  ${index === highlighted
                    ? 'bg-blue-600 text-white'           // keyboard highlighted
                    : 'hover:bg-blue-50 text-gray-800'}  // mouse hover
                `}
              >
                {option.label}
              </li>
            ))}

            {/* "Add new" option — only shown when text doesn't match any option */}
            {onNewEntry && isNewEntry && (
              <li
                data-item
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleAddNew()
                }}
                className={`
                  px-3 py-2 text-sm cursor-pointer border-t border-gray-100
                  font-medium
                  ${highlighted === filtered.length
                    ? 'bg-green-600 text-white'
                    : 'text-green-700 hover:bg-green-50'}
                `}
              >
                ＋ Add new: "{inputText.trim()}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}