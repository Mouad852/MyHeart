/**
 * Sidebar.jsx — Left navigation panel.
 * Shows the brand, nav links, and a system status indicator.
 */
import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useGatewayHealth } from '../../hooks/useGatewayHealth'
import { ROLES } from '../../auth/roles'
import {
  Users, Stethoscope, CalendarDays,
  Activity, LayoutDashboard, ChevronRight,
  ReceiptText, Pill, FlaskConical, HeartPulse, Sun,
} from 'lucide-react'

/**
 * `roles` mirrors the gateway's SecurityConfig. Hiding a link is a courtesy,
 * not a security control: the gateway rejects the request regardless.
 */
const NAV_ITEMS = [
  // ── Doctor workspace ──────────────────────────────
  {
    to: '/today', icon: Sun, label: 'Today', end: true,
    roles: [ROLES.DOCTOR, ROLES.ADMIN],
  },
  // ── Patient portal ────────────────────────────────
  {
    to: '/my-health', icon: HeartPulse, label: 'My health', end: true,
    roles: [ROLES.PATIENT],
  },
  // ── Core ──────────────────────────────────────────
  {
    to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.BILLING, ROLES.NURSE],
  },
  {
    to: '/patients', icon: Users, label: 'Patients',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE],
  },
  {
    to: '/doctors', icon: Stethoscope, label: 'Doctors',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  },
  {
    to: '/appointments', icon: CalendarDays, label: 'Appointments',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  },
  // ── Extended services ─────────────────────────────
  {
    to: '/billing', icon: ReceiptText, label: 'Billing',
    roles: [ROLES.ADMIN, ROLES.BILLING, ROLES.RECEPTIONIST],
  },
  {
    to: '/prescriptions', icon: Pill, label: 'Prescriptions',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  },
  {
    to: '/labs', icon: FlaskConical, label: 'Labs',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  },
]

/** Dot colour per gateway health state. */
const STATUS_DOT = {
  checking: 'bg-slate-500',
  up: 'bg-teal-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
}

/** Links that sit below the divider, when the user can see any of them. */
const EXTENDED_SERVICES = ['/billing', '/prescriptions', '/labs']

export default function Sidebar() {
  const { hasAnyRole } = useAuth()
  const navItems = NAV_ITEMS.filter((item) => hasAnyRole(item.roles))
  const health = useGatewayHealth()

  return (
    <aside className="w-64 min-h-screen bg-navy-900 border-r border-white/5
                      flex flex-col flex-shrink-0 relative overflow-hidden">

      {/* Dot-grid decorative background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(45,212,191,0.12) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Teal glow blob */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full
                      bg-teal-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">

        {/* Brand */}
        <div className="px-6 pt-7 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center
                            shadow-teal-glow">
              <Activity size={18} className="text-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none">MedCore</p>
              <p className="text-[10px] text-teal-500/80 font-medium tracking-widest uppercase mt-0.5">
                Medical System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation label */}
        <p className="px-6 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>

        {/* Nav links */}
        <nav className="px-3 flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label, end }, idx) => (
            <React.Fragment key={to}>
              {idx > 0 && EXTENDED_SERVICES.includes(to)
                && !EXTENDED_SERVICES.includes(navItems[idx - 1].to) && (
                <div className="mx-3 my-2 border-t border-white/5" />
              )}
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
         transition-all duration-200
         ${isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={17}
                      className={`flex-shrink-0 transition-colors duration-200
              ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                    />
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <ChevronRight size={13} className="text-teal-500/60" />
                    )}
                  </>
                )}
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* System status footer, driven by the gateway's health endpoint */}
        <div className="px-5 py-5 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              {health.state === 'up' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full
                                 bg-teal-400 opacity-60" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${STATUS_DOT[health.state]}`} />
            </span>
            <span className="text-xs text-slate-400">{health.label}</span>
          </div>
        </div>

      </div>
    </aside>
  )
}
