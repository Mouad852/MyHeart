/**
 * Header.jsx — Top bar showing current page title + global actions.
 */
import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'

const PAGE_TITLES = {
  '/':             { title: 'Dashboard',     subtitle: 'Overview of your medical system'       },
  '/patients':     { title: 'Patients',      subtitle: 'Manage patient records'                },
  '/doctors':      { title: 'Doctors',       subtitle: 'Manage medical staff'                  },
  '/appointments': { title: 'Appointments',  subtitle: 'Schedule and track appointments'       },
  '/billing':      { title: 'Billing',       subtitle: 'Manage invoices and payments'          },
  '/prescriptions':{ title: 'Prescriptions', subtitle: 'Create and review prescriptions'       },
  '/labs':         { title: 'Labs',          subtitle: 'Manage lab requests and test results'  },
}

export default function Header() {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] || PAGE_TITLES['/']

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
      <div className="flex items-center gap-2">
        {/* Search hint */}
        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                     bg-white/5 border border-white/10 text-slate-500 text-xs
                     hover:text-slate-300 hover:border-white/20 transition-all duration-150"
          title="Search (coming soon)"
        >
          <Search size={13} />
          <span>Search…</span>
        </button>

        {/* Notification bell */}
        <button className="btn-icon relative" title="Notifications">
          <Bell size={16} />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal-400" />
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30
                        flex items-center justify-center
                        font-display font-bold text-teal-400 text-xs cursor-pointer
                        hover:bg-teal-500/30 transition-colors duration-150"
             title="Admin user">
          AD
        </div>
      </div>
    </header>
  )
}
