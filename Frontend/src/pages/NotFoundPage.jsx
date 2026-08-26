/**
 * NotFoundPage.jsx — a route that does not exist.
 *
 * No 96px numerals. "404" set at display size is a decoration of a dead end;
 * what the reader needs is which address failed and one way back, and the page
 * they were sent to depends on their role, so the link goes to *their* home
 * rather than to a dashboard a patient cannot open.
 */
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { homeRouteFor } from '../auth/roles'
import { Panel } from '../components/ui/Panel'

export default function NotFoundPage() {
  const { pathname } = useLocation()
  const { roles } = useAuth()
  const home = homeRouteFor(roles)

  return (
    <Panel className="mx-auto max-w-xl">
      <div className="border-l-2 border-strong px-6 py-8">
        <p className="section-label">Not found</p>
        <h1 className="mt-3 font-display text-title font-bold text-white">
          There is nothing at this address
        </h1>
        <p className="ident mt-3 break-all text-sm text-slate-500">{pathname}</p>
        <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-slate-400">
          The page may have been renamed, or the link that brought you here may be out
          of date.
        </p>
        <Link to={home} className="btn-secondary mt-7">
          Back to {home === '/' ? 'the overview' : home.replace('/', '').replace('-', ' ')}
        </Link>
      </div>
    </Panel>
  )
}
