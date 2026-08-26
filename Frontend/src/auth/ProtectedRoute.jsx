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
    <div className="flex min-h-[100dvh] items-center justify-center bg-navy-950">
      <div className="flex flex-col items-center gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/25 border-t-teal-500" />
        <p className="text-sm text-slate-500">Checking your session</p>
      </div>
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
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-navy-800">
          <ShieldOff size={22} className="text-slate-400" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-white">
          You do not have access to this area
        </h2>
        <p className="mt-2 leading-relaxed text-slate-400">
          Your role does not include this part of the clinic. If you believe that is
          wrong, ask an administrator to review your permissions.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to={homeRoute} className="btn-primary">
            Go to your home page
          </Link>
          <button type="button" onClick={logout} className="btn-secondary">
            Sign out
          </button>
        </div>
      </div>
    </div>
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
