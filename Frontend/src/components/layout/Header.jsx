/**
 * Header.jsx — the bar across the top.
 *
 * It does not carry the page title. It used to hold a title and a subtitle that
 * every page then repeated in its own words twenty pixels below, in a larger
 * size, so the reader paid for the same information twice. The title lives with
 * the page that owns it.
 *
 * What is left is what belongs to the whole application rather than to any one
 * screen: a way into the register from wherever you are, and who you are signed
 * in as. Appearance lives in the account menu, where a setting somebody changes
 * once belongs — not as two more controls competing with the work.
 */
import { useEffect, useRef, useState } from 'react'
import { Check, LogOut, Menu, Monitor, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES, roleLabel } from '../../auth/roles'
import { useAppearance } from '../../hooks/useAppearance'
import PatientSearch from './PatientSearch'

/** Two letters from a display name, falling back to the account name. */
function initials(name, username) {
  const source = (name || username || '').trim()
  if (!source) return '··'
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/** A row of mutually exclusive choices inside the menu. */
function Choice({ label, options, value, onChange }) {
  return (
    <div className="border-t border-rule px-4 py-3">
      <p className="section-label mb-2">{label}</p>
      <div className="flex gap-1" role="group" aria-label={label}>
        {options.map((option) => {
          const Icon = option.icon
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded border
                          px-2 py-1.5 text-meta transition-colors duration-fast
                          ${
                            selected
                              ? 'border-primary bg-primary-soft font-medium text-primary'
                              : 'border-rule-strong text-ink-2 hover:border-ink-3 hover:text-ink'
                          }`}
            >
              {Icon ? (
                <Icon size={13} strokeWidth={2} aria-hidden="true" />
              ) : (
                selected && <Check size={12} strokeWidth={2.5} aria-hidden="true" />
              )}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UserMenu() {
  const { fullName, username, role, email, logout } = useAuth()
  const { theme, setTheme, density, setDensity } = useAppearance()
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
                    duration-fast hover:bg-raised ${open ? 'bg-raised' : ''}`}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
                     bg-primary-soft text-[11px] font-semibold text-primary
                     ring-1 ring-inset ring-primary/25"
        >
          {initials(fullName, username)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-meta font-medium text-ink">
            {fullName || username || 'Signed in'}
          </span>
          <span className="block text-meta text-ink-3">
            {role ? roleLabel(role) : 'No role assigned'}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 animate-fade-in
                     overflow-hidden rounded border border-rule-strong bg-surface shadow-overlay"
        >
          <div className="px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">{fullName || username}</p>
            <p className="ident mt-0.5 truncate text-meta text-ink-3">{username}</p>
            {email && <p className="mt-1 truncate text-meta text-ink-3">{email}</p>}
            <p className="mt-2 text-meta text-ink-2">
              {role ? roleLabel(role) : 'No role assigned'}
            </p>
          </div>

          <Choice label="Appearance" options={THEMES} value={theme} onChange={setTheme} />

          <Choice
            label="Row height"
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
            value={density}
            onChange={setDensity}
          />

          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2.5 border-t border-rule px-4 py-3
                       text-sm text-ink-2 transition-colors duration-fast
                       hover:bg-raised hover:text-ink"
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
      className="sticky top-0 z-40 flex-shrink-0 border-b border-rule bg-ground/90
                 px-4 backdrop-blur-md sm:px-6 lg:px-8"
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
          <span className="h-4 w-[3px] bg-primary" aria-hidden="true" />
          <span className="text-sm font-bold tracking-tight text-ink">MedCore</span>
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
