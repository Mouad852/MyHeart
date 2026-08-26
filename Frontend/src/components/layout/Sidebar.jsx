/**
 * Sidebar.jsx — where you are, and where you can go.
 *
 * Three decisions shape this file.
 *
 * The links are grouped by the kind of work they are, and the groups are
 * ordered by who is signed in. A doctor's day starts with clinical work, so
 * Records sits above Clinic for them; a billing clerk opens the product to do
 * money, so Finance is second from the top. Everyone gets the same links they
 * are entitled to, in the order that matches their job. Nobody has to learn a
 * navigation designed around somebody else's role.
 *
 * The active state is a rule, not a box. A filled rounded rectangle with a
 * border and a chevron is four separate signals saying one thing; a teal rule
 * flush against the edge of the panel, a small lift in the ground and a shift
 * to white text say it once, and leave the accent colour meaning something.
 *
 * The decoration is gone. There was a teal dot grid and a blurred teal orb
 * behind this panel. Neither carried information, both cost contrast against
 * the text sitting on top of them, and a blurred glow in the corner of a
 * clinical tool is the single most reliable sign that a screen was styled
 * rather than designed.
 *
 * Which links appear mirrors the gateway's SecurityConfig. Hiding one is a
 * courtesy, never a control: the gateway refuses the request either way.
 */
import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  FlaskConical,
  Gauge,
  HeartPulse,
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

/**
 * Grouped by the kind of work, not by which microservice happens to serve it.
 * "Prescriptions" and "Labs" are one thought to a doctor — things written about
 * a patient — even though they are two services and two databases.
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

const HEALTH_DOT = {
  checking: 'bg-slate-600',
  up: 'bg-teal-500',
  degraded: 'bg-amber-400',
  down: 'bg-rose-400',
}

/** The wordmark. The teal rule is the same rule the whole product hangs off. */
function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="h-7 w-[3px] flex-shrink-0 bg-teal-400" aria-hidden="true" />
      <span>
        <span className="block font-display text-lg font-extrabold leading-none tracking-tight text-white">
          MedCore
        </span>
        <span className="mt-1 block text-micro font-medium uppercase text-slate-500">
          Clinic operations
        </span>
      </span>
    </span>
  )
}

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 py-2 pl-5 pr-3 text-sm
         transition-colors duration-fast
         ${
           isActive
             ? 'bg-white/[0.045] font-medium text-white'
             : 'text-slate-400 hover:bg-white/[0.025] hover:text-slate-100'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Flush to the panel edge, so the rule reads as a marker in the
              margin rather than as a border around the link. */}
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-[2px] transition-colors duration-fast
                        ${isActive ? 'bg-teal-400' : 'bg-transparent'}`}
          />
          <Icon
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`flex-shrink-0 transition-colors duration-fast
                        ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}
          />
          {label}
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

  const order = GROUP_ORDER[role] ?? DEFAULT_ORDER
  const groups = order
    .map((id) => GROUPS.find((group) => group.id === id))
    .filter(Boolean)
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAnyRole(item.roles)) }))
    .filter((group) => group.items.length > 0)

  return (
    <div
      className="flex h-full min-h-0 w-60 flex-col border-r border-hairline bg-navy-900"
      onClick={onNavigate}
    >
      <div className="flex items-center justify-between px-5 pb-6 pt-5">
        <Wordmark />
        {isDrawer && (
          <button type="button" className="btn-icon lg:hidden" aria-label="Close navigation">
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {groups.map((group, index) => (
          <div key={group.id} className={index > 0 ? 'mt-6' : ''}>
            {/* A single-link group does not need naming; the link is its own
                label and the heading would be pure chrome. */}
            {(group.items.length > 1 || index > 0) && (
              <p className="section-label mb-2 px-5">{group.label}</p>
            )}
            <div className="flex flex-col">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Read from the gateway's own health endpoint, so it is a fact rather
          than a reassuring label somebody typed once. */}
      <div className="flex items-center gap-2.5 border-t border-hairline px-5 py-3.5">
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${HEALTH_DOT[health.state]}`}
          aria-hidden="true"
        />
        <span className="truncate text-meta text-slate-500">{health.label}</span>
      </div>
    </div>
  )
}
