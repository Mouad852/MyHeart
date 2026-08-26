/**
 * Header.jsx — Top bar showing current page title + global actions.
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LogOut, Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { roleLabel } from '../../auth/roles'

const PAGE_TITLES = {
  '/':             { title: 'Dashboard',     subtitle: 'Overview of your medical system'       },
  '/today':        { title: 'Today',         subtitle: 'Your appointments for the day'         },
  '/my-health':    { title: 'My health',     subtitle: 'Your appointments and personal details'},
  '/patients':     { title: 'Patients',      subtitle: 'Manage patient records'                },
  '/doctors':      { title: 'Doctors',       subtitle: 'Manage medical staff'                  },
  '/appointments': { title: 'Appointments',  subtitle: 'Schedule and track appointments'       },
  '/billing':      { title: 'Billing',       subtitle: 'Manage invoices and payments'          },
  '/prescriptions':{ title: 'Prescriptions', subtitle: 'Create and review prescriptions'       },
  '/labs':         { title: 'Labs',          subtitle: 'Manage lab requests and test results'  },
}

/** Two-letter monogram from a display name, falling back to the username. */
function initials(name, username) {
  const source = (name || username || '').trim()
  if (!source) return '??'
  const parts = source.split(/[\s.]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Titles for paths that carry an id. */
function titleForPath(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (/^\/patients\/\d+$/.test(pathname)) {
    return { title: 'Patient record', subtitle: 'History across the whole clinic' }
  }
  return PAGE_TITLES['/']
}

export default function Header() {
  const { pathname } = useLocation()
  const page = titleForPath(pathname)
  const { fullName, username, role, logout } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="h-16 bg-navy-900/60 border-b border-white/5
                       flex items-center justify-between px-8
                       backdrop-blur-sm sticky top-0 z-30">

      {/* Page title */}
      <div>
        <h1 className="font-display text-lg font-bold text-white leading-none">
          {page.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">{page.subtitle}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search hint */}
        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                     bg-white/5 border border-white/10 text-slate-400 text-xs
                     hover:text-slate-200 hover:border-white/20 transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-teal-400
                     focus:ring-offset-2 focus:ring-offset-navy-900"
          title="Search is not available yet"
        >
          <Search size={13} aria-hidden="true" />
          <span>Search</span>
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2.5
                       transition-colors duration-150 hover:bg-white/5
                       focus:outline-none focus:ring-2 focus:ring-teal-400
                       focus:ring-offset-2 focus:ring-offset-navy-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full
                             border border-teal-500/30 bg-teal-500/20
                             font-display text-xs font-bold text-teal-400">
              {initials(fullName, username)}
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-xs font-semibold text-slate-200">
                {fullName || username || 'Signed in'}
              </span>
              <span className="block text-[10px] text-slate-500">
                {role ? roleLabel(role) : 'No role assigned'}
              </span>
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl
                         border border-white/10 bg-navy-800 shadow-card"
            >
              <div className="border-b border-white/5 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {fullName || username}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                  {username}
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-300
                           transition-colors duration-150 hover:bg-white/5 hover:text-white
                           focus:outline-none focus:bg-white/5"
              >
                <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
