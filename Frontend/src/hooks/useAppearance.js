/**
 * useAppearance.js — theme and density, remembered per browser.
 *
 * Two settings, and both exist because the research pointed in two directions
 * at once.
 *
 * MedCore is light by default: text on a light ground is read faster and with
 * more errors caught, and that advantage grows as type gets smaller — which is
 * exactly what this product is made of. But the case for dark is real and it is
 * occupational rather than cosmetic. A clinician spends tens of thousands of
 * hours in front of this, and for anyone with early lens clouding less display
 * light means less scatter. So dark is offered properly, generated from the
 * same tokens, rather than being a second design or an afterthought.
 *
 * Density is here for the same reason a payments dashboard ships it: a
 * receptionist working a register and a doctor glancing between patients want
 * different row heights, and choosing one for both is choosing wrong for one.
 *
 * Both are stamped on the document element, and index.html reads them back
 * before first paint so the page never flashes the theme the reader did not ask
 * for.
 */
import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'medcore-theme'
const DENSITY_KEY = 'medcore-density'

/** Storage is refused in some private-browsing modes; the defaults are correct. */
function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* Nothing to do: the setting simply does not persist. */
  }
}

export function useAppearance() {
  // `system` is a real third state, not a synonym for light: it follows the
  // operating system, which is what most people actually want.
  const [theme, setThemeState] = useState(() => read(THEME_KEY) ?? 'system')
  const [density, setDensityState] = useState(() => read(DENSITY_KEY) ?? 'comfortable')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    write(THEME_KEY, theme === 'system' ? null : theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    if (density === 'compact') root.setAttribute('data-density', 'compact')
    else root.removeAttribute('data-density')
    write(DENSITY_KEY, density === 'compact' ? 'compact' : null)
  }, [density])

  const setTheme = useCallback((value) => setThemeState(value), [])
  const setDensity = useCallback((value) => setDensityState(value), [])

  /** What the reader is actually looking at right now, system included. */
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  return { theme, resolvedTheme, setTheme, density, setDensity }
}
