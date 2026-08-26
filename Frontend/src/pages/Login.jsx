/**
 * Login.jsx — the entry point to MedCore.
 *
 * There is deliberately no password field here. Authentication uses the
 * OpenID Connect Authorization Code Flow with PKCE, so credentials are entered
 * on Keycloak's own screen and this application never handles them.
 */
import React, { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Check,
  Copy,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { homeRouteFor } from '../auth/roles'

/**
 * Demo accounts, shown because this is a portfolio deployment seeded with
 * fictional records. Remove this block before any real clinical use.
 */
const DEMO_ACCOUNTS = [
  { username: 'admin.demo', role: 'Administrator', summary: 'Full platform access' },
  { username: 'doctor.demo', role: 'Doctor', summary: 'Clinical workspace' },
  { username: 'reception.demo', role: 'Receptionist', summary: 'Front desk and scheduling' },
  { username: 'patient.demo', role: 'Patient', summary: 'Personal records only' },
]

const DEMO_PASSWORD = 'DemoPass123!'

function DemoAccountRow({ account, onCopy, copied }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-mono text-sm text-slate-200 truncate">{account.username}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {account.role}. {account.summary}.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(account.username)}
        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10
                   px-2.5 py-1.5 text-xs font-medium text-slate-300
                   transition-colors duration-200
                   hover:border-teal-500/40 hover:text-teal-400
                   focus:outline-none focus:ring-2 focus:ring-teal-400
                   focus:ring-offset-2 focus:ring-offset-navy-900
                   active:scale-[0.98]"
        aria-label={`Copy username ${account.username}`}
      >
        {copied === account.username ? (
          <>
            <Check size={13} strokeWidth={2.5} aria-hidden="true" />
            Copied
          </>
        ) : (
          <>
            <Copy size={13} strokeWidth={2} aria-hidden="true" />
            Copy
          </>
        )}
      </button>
    </div>
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
      // Clipboard access can be blocked; the value is visible on screen anyway.
    }
  }

  if (authenticated) {
    return <Navigate to={returnTo || homeRouteFor(roles)} replace />
  }

  return (
    <main className="min-h-[100dvh] bg-navy-950 text-slate-200">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1400px] lg:grid-cols-[1.05fr_1fr]">
        {/* ── Brand panel ─────────────────────────────────────────── */}
        <section className="relative hidden overflow-hidden border-r border-white/5 bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(45,212,191,0.12) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 shadow-teal-glow">
              <Activity size={18} className="text-navy-950" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <p className="font-display text-lg font-bold leading-none text-white">MedCore</p>
          </div>

          <div className="relative z-10 max-w-lg">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Every part of the clinic, in one place.
            </h1>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-slate-400">
              Scheduling, patient records, prescriptions, laboratory work and billing,
              connected so your team stops re-typing the same information.
            </p>
          </div>

          <dl className="relative z-10 grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
            {[
              { value: '6', label: 'Clinical services' },
              { value: '5', label: 'Staff roles' },
              { value: '1', label: 'Patient record' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="font-display text-3xl font-bold text-teal-400">{stat.value}</span>
                  <span className="mt-1 block text-xs leading-snug text-slate-500">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Sign-in panel ───────────────────────────────────────── */}
        <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            {/* Brand lockup, small screens only */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 shadow-teal-glow">
                <Activity size={18} className="text-navy-950" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <p className="font-display text-lg font-bold leading-none text-white">MedCore</p>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Sign in
            </h2>
            <p className="mt-2 leading-relaxed text-slate-400">
              You will be taken to the secure MedCore identity service to enter your
              credentials.
            </p>

            {status === 'failed' && (
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4"
              >
                <TriangleAlert
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-red-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-200">
                    Identity service unreachable
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-red-200/70">
                    {error || 'Keycloak did not respond.'} Confirm the backend is running,
                    then reload this page.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => login(returnTo)}
              disabled={status !== 'ready'}
              className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl
                         bg-teal-500 px-5 py-3.5 text-sm font-semibold text-navy-950
                         shadow-teal-glow transition-all duration-200
                         hover:bg-teal-400 active:translate-y-px active:bg-teal-600
                         disabled:cursor-not-allowed disabled:bg-navy-700 disabled:text-slate-500
                         disabled:shadow-none
                         focus:outline-none focus:ring-2 focus:ring-teal-400
                         focus:ring-offset-2 focus:ring-offset-navy-950"
            >
              {status === 'initialising' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />
                  Connecting
                </>
              ) : (
                <>
                  Continue to sign in
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
              Protected by OpenID Connect with PKCE
            </p>

            {/* ── Demo accounts ───────────────────────────────────── */}
            <div className="mt-12 rounded-2xl border border-white/5 bg-navy-900/60 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-semibold text-white">Demo accounts</h3>
                <button
                  type="button"
                  onClick={() => handleCopy(DEMO_PASSWORD)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400
                             transition-colors duration-200 hover:text-teal-400
                             focus:outline-none focus:ring-2 focus:ring-teal-400
                             focus:ring-offset-2 focus:ring-offset-navy-900 rounded"
                  aria-label="Copy the shared demo password"
                >
                  {copied === DEMO_PASSWORD ? (
                    <>
                      <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} strokeWidth={2} aria-hidden="true" />
                      {DEMO_PASSWORD}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-1 divide-y divide-white/5">
                {DEMO_ACCOUNTS.map((account) => (
                  <DemoAccountRow
                    key={account.username}
                    account={account}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                ))}
              </div>

              <p className="mt-4 border-t border-white/5 pt-4 text-xs leading-relaxed text-slate-500">
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
