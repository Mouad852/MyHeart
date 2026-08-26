/**
 * ProtectedRoute.jsx — route guard.
 *
 * This is a usability layer, not a security boundary. The API gateway and the
 * services enforce the real rules; hiding a route here only spares people from
 * clicking into a screen that would return 403.
 */
import React from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { homeRouteFor, rolesForPath } from './roles'

function AuthPending() {
  return (
    <div
      role="status"
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ground"
    >
      <span className="h-6 w-[3px] bg-primary" aria-hidden="true" />
      <p className="text-sm text-ink-3">Checking your session</p>
    </div>
  )
}

/**
 * Shown when someone reaches a route their role does not cover.
 *
 * It always offers a way out. An earlier version rendered outside the layout,
 * which left a patient staring at a message with no navigation and no way to
 * sign out.
 */
function NotPermitted({ homeRoute }) {
  const { logout } = useAuth()

  return (
    <section className="panel mx-auto max-w-xl">
      {/* Left-aligned and plainly worded. A centred column under a large icon
          reads as an apology; this is not a failure, it is the system working
          exactly as it was configured to. */}
      <div className="border-l-2 border-rule-strong px-6 py-8">
        <p className="section-label flex items-center gap-2">
          <ShieldOff size={12} strokeWidth={2} aria-hidden="true" />
          Not permitted
        </p>
        <h1 className="mt-3 text-title font-bold text-ink">
          This part of the clinic is not open to your role
        </h1>
        <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-ink-2">
          Access is decided by the API gateway, not by this page, so the screen would
          have nothing to show even if it opened. If you think your role is wrong, an
          administrator can change it.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <Link to={homeRoute} className="btn-primary">
            Go to your home page
          </Link>
          <button type="button" onClick={logout} className="btn-secondary">
            Sign out
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * Gate 1: is anyone signed in at all. Sits above the layout, because an
 * unauthenticated visitor should see the login page, not a chrome-less shell.
 */
export default function ProtectedRoute() {
  const { status, authenticated } = useAuth()
  const location = useLocation()

  if (status === 'initialising') {
    return <AuthPending />
  }

  if (!authenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  return <Outlet />
}

/**
 * Gate 2: does this role cover this route. Sits *inside* the layout, so a
 * denial still shows the sidebar, the header and a way to sign out.
 */
export function RequireRole({ allowedRoles }) {
  const { hasAnyRole, roles } = useAuth()
  const location = useLocation()

  const homeRoute = homeRouteFor(roles)
  const required = allowedRoles ?? rolesForPath(location.pathname)

  if (required && !hasAnyRole(required)) {
    // Landing on the staff dashboard as a patient is a routing accident rather
    // than a permission problem, so send them to their own home instead of
    // showing a denial they cannot act on.
    if (location.pathname === '/' && homeRoute !== '/') {
      return <Navigate to={homeRoute} replace />
    }
    return <NotPermitted homeRoute={homeRoute} />
  }

  return <Outlet />
}
