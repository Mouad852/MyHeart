import { useEffect, useState } from 'react'

/**
 * Delays a rapidly changing value, so typing in a search box does not fire a
 * request per keystroke.
 */
export function useDebouncedValue(value, delayMs = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
