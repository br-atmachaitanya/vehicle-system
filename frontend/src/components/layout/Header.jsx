// useEffect and useState are React "hooks"
// Hooks let function components use React features
import { useEffect, useState } from 'react'

export default function Header({ title }) {
  // useState(initialValue) returns [currentValue, setterFunction]
  // When you call setTime(), React re-renders this component with new time
  const [time, setTime] = useState(new Date())

  // useEffect runs after the component renders
  // The empty [] means "run once when component mounts" (like page load)
  useEffect(() => {
    // setInterval calls setTime every 1000ms (1 second)
    const timer = setInterval(() => setTime(new Date()), 1000)

    // Return a cleanup function — React calls this when component unmounts
    // Without this, the interval keeps running even after leaving the page (memory leak)
    return () => clearInterval(timer)
  }, []) // [] = run only once, not on every re-render

  const formatDate = (d) => d.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })

  const formatTime = (d) => d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  return (
    // h-14 = fixed height, flex items-center = vertically center content
    <header className="h-14 bg-white border-b border-gray-200
                        flex items-center justify-between px-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>

      {/* Live clock — updates every second because time state changes */}
      <div className="text-right">
        <div className="text-sm font-medium text-gray-800">{formatTime(time)}</div>
        <div className="text-xs text-gray-500">{formatDate(time)}</div>
      </div>
    </header>
  )
}