/**
 * Sidebar.jsx — where you are, and where you can go.
 *
 * Four decisions shape this file.
 *
 * It is a sidebar rather than a top navigation because seven roles with
 * different jobs need persistent, labelled destinations. A top bar would put
 * half of them behind a menu, and the one thing this product cannot afford is a
 * receptionist hunting for Billing.
 *
 * The links are grouped by the kind of work they are, and the groups are
 * ordered by who is signed in. A doctor's day starts with clinical work, so
 * Records sits above Clinic for them; a billing clerk opens the product to do
 * money, so Finance is second from the top. Everyone gets the links they are
 * entitled to, in the order that matches their job.
 *
 * It recedes. On a light ground the chrome sits on the page tint and the
 * content panels are white above it, so the eye is drawn to the work rather
 * than to the furniture. Active is a rule in the margin plus a tinted ground —
 * a marker, not a box.
 *
 * It collapses to a 60px rail, because a doctor reading a long patient history
 * would rather have the width. The choice is remembered.
 *
 * Which links appear mirrors the gateway's SecurityConfig. Hiding one is a
 * courtesy, never a control: the gateway refuses the request either way.
 */
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  FlaskConical,
  Gauge,
  HeartPulse,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  ReceiptText,
  Stethoscope,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { useGatewayHealth } from '../../hooks/useGatewayHealth'
import { ROLES } from '../../auth/roles'

const R = ROLES
const COLLAPSE_KEY = 'medcore-nav-collapsed'

/**
 * Grouped by the kind of work, not by which microservice happens to serve it.
 * Prescriptions and Laboratory are one thought to a doctor — things written
 * about a patient — even though they are two services and two databases.
 */
const GROUPS = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { to: '/today', icon: Sun, label: 'Today', end: true, roles: [R.DOCTOR, R.ADMIN] },
      { to: '/my-health', icon: HeartPulse, label: 'My health', end: true, roles: [R.PATIENT] },
      {
        to: '/',
        icon: Gauge,
        label: 'Overview',
        end: true,
        roles: [R.ADMIN, R.DOCTOR, R.RECEPTIONIST, R.BILLING, R.NURSE],
      },
    ],
  },
  {
    id: 'clinic',
    label: 'Clinic',
    items: [
      {
        to: '/appointments',
        icon: CalendarDays,
        label: 'Appointments',
        roles: [R.ADMIN, R.DOCTOR, R.RECEPTIONIST],
      },
      {
        to: '/patients',
        icon: Users,
        label: 'Patients',
        roles: [R.ADMIN, R.DOCTOR, R.RECEPTIONIST, R.NURSE],
      },
      {
        to: '/doctors',
        icon: Stethoscope,
        label: 'Doctors',
        roles: [R.ADMIN, R.DOCTOR, R.RECEPTIONIST],
      },
    ],
  },
  {
    id: 'records',
    label: 'Records',
    items: [
      {
        to: '/prescriptions',
        icon: Pill,
        label: 'Prescriptions',
        roles: [R.ADMIN, R.DOCTOR, R.RECEPTIONIST],
      },
      {
        to: '/labs',
        icon: FlaskConical,
        label: 'Laboratory',
        roles: [R.ADMIN, R.DOCTOR, R.RECEPTIONIST],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        to: '/billing',
        icon: ReceiptText,
        label: 'Billing',
        roles: [R.ADMIN, R.BILLING, R.RECEPTIONIST],
      },
    ],
  },
]

/** What each role opens the product to do, most important first. */
const GROUP_ORDER = {
  [R.DOCTOR]: ['workspace', 'records', 'clinic', 'finance'],
  [R.RECEPTIONIST]: ['workspace', 'clinic', 'finance', 'records'],
  [R.BILLING]: ['workspace', 'finance', 'clinic', 'records'],
  [R.NURSE]: ['workspace', 'clinic', 'records', 'finance'],
  [R.ADMIN]: ['workspace', 'clinic', 'records', 'finance'],
  [R.PATIENT]: ['workspace'],
}

const DEFAULT_ORDER = ['workspace', 'clinic', 'records', 'finance']

/**
 * The health dot never uses a colour on its own — the label beside it says the
 * same thing in words, which is the rule the whole product follows.
 */
const HEALTH_DOT = {
  checking: 'bg-ink-3',
  up: 'bg-settled',
  degraded: 'bg-attention',
  down: 'bg-critical',
}

/** The wordmark. The rule is the same one the whole product hangs off. */
function Wordmark({ collapsed }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="h-7 w-[3px] flex-shrink-0 bg-primary" aria-hidden="true" />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-lg font-bold leading-none tracking-tight text-ink">
            MedCore
          </span>
          <span className="mt-1 block truncate text-meta text-ink-3">Clinic operations</span>
        </span>
      )}
    </span>
  )
}

function NavItem({ to, icon: Icon, label, end, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 py-2 pl-5 pr-3 text-sm
         transition-colors duration-fast
         ${collapsed ? 'justify-center pl-3' : ''}
         ${
           isActive
             ? 'bg-primary-soft font-medium text-ink'
             : 'text-ink-2 hover:bg-raised hover:text-ink'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Flush to the panel edge, so the rule reads as a marker in the
              margin rather than a border around the link. */}
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-[2px] transition-colors duration-fast
                        ${isActive ? 'bg-primary' : 'bg-transparent'}`}
          />
          <Icon
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`flex-shrink-0 transition-colors duration-fast
                        ${isActive ? 'text-primary' : 'text-ink-3 group-hover:text-ink-2'}`}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

/**
 * @param {{ onNavigate?: () => void, isDrawer?: boolean }} props
 *   `onNavigate` closes the mobile drawer once a destination is chosen.
 */
export default function Sidebar({ onNavigate, isDrawer = false }) {
  const { hasAnyRole, role } = useAuth()
  const health = useGatewayHealth()

  const [collapsed, setCollapsed] = useState(() => {
    if (isDrawer) return false
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (isDrawer) return
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* The rail simply does not remember. */
    }
  }, [collapsed, isDrawer])

  const order = GROUP_ORDER[role] ?? DEFAULT_ORDER
  const groups = order
    .map((id) => GROUPS.find((group) => group.id === id))
    .filter(Boolean)
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAnyRole(item.roles)) }))
    .filter((group) => group.items.length > 0)

  return (
    <div
      className={`flex h-full min-h-0 flex-col border-r border-rule bg-ground
                  transition-[width] duration-fast ${collapsed ? 'w-[4.25rem]' : 'w-60'}`}
      onClick={onNavigate}
    >
      <div
        className={`flex items-center justify-between gap-2 pb-6 pt-5
                    ${collapsed ? 'px-4' : 'px-5'}`}
      >
        <Wordmark collapsed={collapsed} />
        {isDrawer && (
          <button type="button" className="btn-icon lg:hidden" aria-label="Close navigation">
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {groups.map((group, index) => (
          <div key={group.id} className={index > 0 ? 'mt-6' : ''}>
            {/* A single-link group at the top does not need naming; the link is
                its own label and the heading would be pure chrome. */}
            {(group.items.length > 1 || index > 0) &&
              (collapsed ? (
                <div className="mx-4 mb-2 border-t border-rule" aria-hidden="true" />
              ) : (
                <p className="section-label mb-2 px-5">{group.label}</p>
              ))}
            <div className="flex flex-col">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Read from the gateway's own health endpoint, so it is a fact rather
          than a reassuring label somebody typed once. */}
      <div
        className={`flex items-center gap-2.5 border-t border-rule py-3
                    ${collapsed ? 'justify-center px-3' : 'px-5'}`}
        title={collapsed ? health.label : undefined}
      >
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${HEALTH_DOT[health.state]}`}
          aria-hidden="true"
        />
        {!collapsed && <span className="truncate text-meta text-ink-3">{health.label}</span>}
        <span className="sr-only">{collapsed ? health.label : ''}</span>
      </div>

      {/* Desktop only: the drawer is already as narrow as it gets. */}
      {!isDrawer && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setCollapsed((value) => !value)
          }}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className={`hidden items-center gap-3 border-t border-rule py-2.5 text-meta
                      text-ink-3 transition-colors duration-fast hover:bg-raised hover:text-ink
                      lg:flex ${collapsed ? 'justify-center px-3' : 'px-5'}`}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose size={15} strokeWidth={1.75} aria-hidden="true" />
              Collapse
            </>
          )}
        </button>
      )}
    </div>
  )
}
