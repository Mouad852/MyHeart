/**
 * Login.jsx — the way in.
 *
 * There is deliberately no password field. Authentication is the OpenID Connect
 * Authorization Code Flow with PKCE, so credentials are typed on Keycloak's own
 * screen and this application never sees them. The page's whole job is to say
 * that clearly and then get out of the way.
 *
 * The left panel is typographic. It previously carried a teal dot grid, a
 * blurred teal orb and three large figures — "6 clinical services · 5 staff
 * roles · 1 patient record" — which is the shape of a marketing page rather
 * than the front door of a clinical tool, and two of the three numbers were
 * facts about the architecture that no user has ever needed.
 */
import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Copy, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { homeRouteFor } from '../auth/roles'
import ErrorBanner from '../components/ui/ErrorBanner'
import { Spinner } from '../components/ui/LoadingSpinner'

/**
 * Shown because this is a portfolio deployment seeded with fictional records.
 * Remove this block before any real clinical use.
 */
const DEMO_ACCOUNTS = [
  { username: 'admin.demo', role: 'Administrator', summary: 'Everything' },
  { username: 'doctor.demo', role: 'Doctor', summary: 'The day, records, prescribing' },
  { username: 'reception.demo', role: 'Receptionist', summary: 'Scheduling and the register' },
  { username: 'patient.demo', role: 'Patient', summary: 'Their own appointments' },
]

const DEMO_PASSWORD = 'DemoPass123!'

/** What the product actually covers, in its own words. */
const AREAS = ['Scheduling', 'Patient records', 'Prescribing', 'Laboratory', 'Billing']

function Wordmark({ className = '' }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="h-8 w-[3px] flex-shrink-0 bg-teal-400" aria-hidden="true" />
      <span>
        <span className="block font-display text-xl font-extrabold leading-none tracking-tight text-white">
          MedCore
        </span>
        <span className="mt-1 block text-micro font-medium uppercase text-slate-500">
          Clinic operations
        </span>
      </span>
    </span>
  )
}

function CopyButton({ value, label, copied, onCopy, mono = false }) {
  const isCopied = copied === value
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      aria-label={`Copy ${label}`}
      className={`btn-row flex-shrink-0 ${mono ? 'font-mono' : ''}`}
    >
      {isCopied ? (
        <Check size={12} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Copy size={12} strokeWidth={2} aria-hidden="true" />
      )}
      {isCopied ? 'Copied' : (label ?? 'Copy')}
    </button>
  )
}

export default function Login() {
  const { authenticated, status, error, login, roles } = useAuth()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(null)

  const returnTo = searchParams.get('returnTo')

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      // Clipboard access can be blocked; the value is on screen anyway.
    }
  }

  if (authenticated) {
    return <Navigate to={returnTo || homeRouteFor(roles)} replace />
  }

  return (
    <main className="min-h-[100dvh] bg-navy-950 text-slate-200">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1500px] lg:grid-cols-[1.1fr_1fr]">
        {/* ── The statement ─────────────────────────────────────────── */}
        <section className="hidden border-r border-hairline bg-navy-900 px-14 py-14 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <Wordmark />

          <div className="max-w-[36rem]">
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white xl:text-5xl">
              Every part of the clinic,
              <br />
              <span className="text-teal-400">in one record.</span>
            </h1>
            <p className="mt-6 max-w-[52ch] leading-relaxed text-slate-400">
              Scheduling, patient history, prescribing, laboratory work and billing —
              held by separate services, read as one thing, so nobody re-types what the
              clinic already knows.
            </p>
          </div>

          {/* Named, not counted. A list of what the product does is worth more
              than a large number saying how many of them there are. */}
          <ul className="flex flex-wrap gap-x-8 gap-y-2 border-t border-hairline pt-7">
            {AREAS.map((area) => (
              <li key={area} className="text-meta text-slate-500">
                {area}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Sign in ───────────────────────────────────────────────── */}
        <section className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <Wordmark className="mb-12 lg:hidden" />

            <h2 className="font-display text-title font-bold text-white">Sign in</h2>
            <p className="mt-2.5 leading-relaxed text-slate-400">
              You will be taken to the MedCore identity service to enter your credentials.
              They are never typed into this application.
            </p>

            {status === 'failed' && (
              <ErrorBanner
                className="mt-6"
                title="The identity service is unreachable"
                message={`${error || 'Keycloak did not respond.'} Confirm the backend is running, then reload this page.`}
              />
            )}

            <button
              type="button"
              onClick={() => login(returnTo)}
              disabled={status !== 'ready'}
              className="btn-primary mt-8 w-full py-3 text-base"
            >
              {status === 'initialising' ? (
                <>
                  <Spinner size={15} />
                  Connecting
                </>
              ) : (
                <>
                  Continue to sign in
                  <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-meta text-slate-500">
              <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
              OpenID Connect, Authorization Code Flow with PKCE
            </p>

            {/* ── Demo accounts ─────────────────────────────────────── */}
            <div className="mt-12 border border-hairline">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
                <h3 className="text-sm font-semibold text-white">Demo accounts</h3>
                <CopyButton
                  mono
                  value={DEMO_PASSWORD}
                  label={DEMO_PASSWORD}
                  copied={copied}
                  onCopy={handleCopy}
                />
              </div>

              <ul className="divide-y divide-hairline">
                {DEMO_ACCOUNTS.map((account) => (
                  <li
                    key={account.username}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="ident truncate text-sm text-slate-100">
                        {account.username}
                      </p>
                      <p className="mt-0.5 truncate text-meta text-slate-500">
                        {account.role} · {account.summary}
                      </p>
                    </div>
                    <CopyButton
                      value={account.username}
                      label="Copy"
                      copied={copied}
                      onCopy={handleCopy}
                    />
                  </li>
                ))}
              </ul>

              <p className="border-t border-hairline px-4 py-3 text-meta leading-relaxed text-slate-500">
                Every record in this deployment is fictional. Do not enter real patient
                information.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
