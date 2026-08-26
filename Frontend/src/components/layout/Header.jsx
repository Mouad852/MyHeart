/**
 * Header.jsx — the bar across the top.
 *
 * It no longer carries the page title. It used to hold a title and a subtitle
 * that every page then repeated in its own words twenty pixels below, in a
 * larger size — the reader paid for the same information twice and the shell
 * and the pages looked like two products bolted together. The title now lives
 * with the page that owns it.
 *
 * What is left is what genuinely belongs to the whole application rather than
 * to any one screen: a way into the register from wherever you are, and who you
 * are signed in as. On a phone it also holds the control that opens navigation.
 */
import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES, roleLabel } from '../../auth/roles'
import PatientSearch from './PatientSearch'

/** Two letters from a display name, falling back to the account name. */
function initials(name, username) {
  const source = (name || username || '').trim()
  if (!source) return '··'
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function UserMenu() {
  const { fullName, username, role, email, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2.5 rounded py-1 pl-1 pr-2 transition-colors
                    duration-fast hover:bg-white/[0.05] ${open ? 'bg-white/[0.05]' : ''}`}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
                     bg-teal-400/12 text-[11px] font-semibold text-teal-300
                     ring-1 ring-inset ring-teal-400/25"
        >
          {initials(fullName, username)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-meta font-medium text-slate-200">
            {fullName || username || 'Signed in'}
          </span>
          <span className="block text-micro text-slate-500">
            {role ? roleLabel(role) : 'No role assigned'}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 animate-fade-in
                     overflow-hidden rounded border border-rule bg-navy-850 shadow-overlay"
        >
          <div className="border-b border-hairline px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-100">
              {fullName || username}
            </p>
            <p className="ident mt-0.5 truncate text-meta text-slate-500">{username}</p>
            {email && (
              <p className="mt-1.5 truncate text-meta text-slate-500">{email}</p>
            )}
            <p className="mt-2.5 text-micro uppercase text-slate-500">
              {role ? roleLabel(role) : 'No role assigned'}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-300
                       transition-colors duration-fast hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * @param {{ onOpenNav: () => void }} props
 */
export default function Header({ onOpenNav }) {
  const { hasAnyRole } = useAuth()

  // Mirrors the gateway: only these roles can read the register, so only they
  // are offered a way to search it.
  const canSearchPatients = hasAnyRole([
    ROLES.ADMIN,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.NURSE,
  ])

  return (
    <header
      className="sticky top-0 z-40 flex-shrink-0 border-b border-hairline
                 bg-navy-950/85 px-4 backdrop-blur-md sm:px-6 lg:px-8"
    >
      {/* The same container the page content uses, so the search field starts
          on the same vertical as the page title beneath it. */}
      <div className="mx-auto flex h-14 w-full max-w-[76rem] items-center gap-3">
      <button
        type="button"
        onClick={onOpenNav}
        className="btn-icon -ml-1 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      {/* The wordmark only appears where the sidebar is not showing it. */}
      <span className="flex items-center gap-2.5 lg:hidden">
        <span className="h-4 w-[3px] bg-teal-400" aria-hidden="true" />
        <span className="font-display text-sm font-extrabold tracking-tight text-white">
          MedCore
        </span>
      </span>

      <div className="flex min-w-0 flex-1 justify-start">
        {canSearchPatients && (
          <div className="hidden min-w-0 flex-1 sm:block">
            <PatientSearch />
          </div>
        )}
      </div>

        <UserMenu />
      </div>
    </header>
  )
}
