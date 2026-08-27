/**
 * Login.jsx — the way in.
 *
 * There is no password field. Authentication is the OpenID Connect
 * Authorization Code Flow with PKCE, so credentials are typed on Keycloak's own
 * screen and this application never sees them. The page's whole job is to say
 * that clearly, get out of the way, and — because this is a portfolio
 * deployment — tell somebody arriving cold what they are looking at.
 *
 * The left panel earns its half now.
 *
 * It used to hold three small blocks pinned to the top, middle and bottom of a
 * 900px column: a wordmark, a two-line headline and five words in a row. Two
 * hundred and fifty pixels of nothing above the headline, the same below it,
 * and a list of areas stranded on the floor three hundred pixels away from the
 * paragraph it belonged to. `justify-between` is not a composition; it is what
 * happens when there is not enough content and nobody decided what to do about
 * it.
 *
 * So it carries real content — what the system actually covers, named and
 * described — set as one centred block. It fills the height because there is
 * something to fill it with, and somebody arriving cold learns what MedCore is
 * in about ten seconds without signing in.
 */
import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Copy, ShieldCheck } from 'lucide-react'
import { DEMO_ACCOUNTS, IS_DEMO } from '../demo/config'
import { useAuth } from '../auth/AuthProvider'
import { homeRouteFor } from '../auth/roles'
import ErrorBanner from '../components/ui/ErrorBanner'
import { Spinner } from '../components/ui/LoadingSpinner'

/**
 * Shown because this is a portfolio deployment seeded with fictional records.
 * Remove this block before any real clinical use.
 */
const DEMO_ACCOUNTS_STATIC = [
  { username: 'admin.demo', role: 'Administrator', summary: 'Everything' },
  { username: 'doctor.demo', role: 'Doctor', summary: 'The day, records, prescribing' },
  { username: 'reception.demo', role: 'Receptionist', summary: 'Scheduling and the register' },
  { username: 'patient.demo', role: 'Patient', summary: 'Their own appointments' },
]

const DEMO_PASSWORD = 'DemoPass123!'

/**
 * What the system covers, described rather than listed.
 *
 * Five nouns in a row told a reader nothing they could not have guessed from
 * the word "clinic". Each of these is a true sentence about a screen that
 * exists, which is the only kind of claim worth putting on a front door.
 */
const COVERAGE = [
  ['Front desk', 'Register a patient, book a slot, answer a request'],
  ['The day', 'A doctor’s list in time order, and what may happen next'],
  ['Records', 'Prescriptions that print as A4, reports that attach'],
  ['Ledger', 'What is outstanding, what is late, what is collected'],
  ['Access', 'Seven roles, enforced twice on every request'],
]

function Wordmark({ className = '' }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="h-8 w-[3px] flex-shrink-0 bg-primary" aria-hidden="true" />
      <span>
        <span className="block text-xl font-bold leading-none tracking-tight text-ink">
          MedCore
        </span>
        <span className="mt-1 block text-meta text-ink-3">Clinic operations</span>
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
      className={`link-action inline-flex flex-shrink-0 items-center gap-1.5
                  ${mono ? 'font-mono' : ''}`}
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
    <main className="min-h-[100dvh] bg-surface text-ink">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1560px] lg:grid-cols-[1.25fr_1fr]">
        {/* ── What this is ──────────────────────────────────────────── */}
        <section className="hidden border-r border-rule bg-ground px-14 py-16 lg:flex lg:flex-col lg:justify-center xl:px-20">
          <div className="max-w-[34rem]">
            <Wordmark />

            {/* Balanced, so it does not break between "front" and "desk". */}
            <h1 className="mt-12 text-balance text-4xl font-bold leading-[1.1]
                           tracking-tight text-ink">
              An outpatient clinic, from the front desk to the ledger.
            </h1>

            <p className="mt-6 leading-relaxed text-ink-2">
              Registering patients, running a clinic day, prescribing, filing
              laboratory reports and chasing what is owed — held by six services,
              read as one record.
            </p>

            {/* Ruled rather than boxed, and on one column so the left edge of
                every description lines up. Five rows of substance in place of
                five words in a row. */}
            <dl className="mt-10 border-t border-rule">
              {COVERAGE.map(([area, detail]) => (
                <div
                  key={area}
                  className="grid grid-cols-[7rem_minmax(0,1fr)] gap-5 border-b border-rule py-3"
                >
                  <dt className="text-sm font-semibold text-ink">{area}</dt>
                  <dd className="text-sm text-ink-2">{detail}</dd>
                </div>
              ))}
            </dl>

            <p className="note mt-7">
              Every record in this deployment is fictional. It is a portfolio
              project and is not certified for real medical data.
            </p>
          </div>
        </section>

        {/* ── Sign in ───────────────────────────────────────────────── */}
        <section className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-[26rem]">
            {/* Below lg the statement panel is gone, so the wordmark and a
                one-line version of it travel with the form instead — the page
                still has to say what it is on a phone. */}
            <div className="lg:hidden">
              <Wordmark />
              <p className="mt-6 text-lg font-semibold leading-snug text-ink">
                An outpatient clinic, from the front desk to the ledger.
              </p>
              <div className="mt-8 border-t border-rule" />
            </div>

            <h2 className="mt-8 text-title font-semibold text-ink lg:mt-0">Sign in</h2>
            <p className="mt-2.5 leading-relaxed text-ink-2">
              {IS_DEMO
                ? 'Choose a role. This is the interface running against fixture data, so there is nothing to type and no session to expire.'
                : 'You will be taken to the MedCore identity service to type your credentials. They are never entered into this application.'}
            </p>

            {status === 'failed' && (
              <ErrorBanner
                className="mt-6"
                title="The identity service is unreachable"
                message={`${error || 'Keycloak did not respond.'} Confirm the backend is running, then reload this page.`}
              />
            )}

            {!IS_DEMO && (
            <button
              type="button"
              onClick={() => login(returnTo)}
              disabled={status !== 'ready'}
              className="btn-primary mt-7 w-full py-2.5 text-base"
            >
              {status === 'initialising' ? (
                <>
                  <Spinner size={15} />
                  Connecting
                </>
              ) : (
                'Continue to sign in'
              )}
            </button>
            )}

            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-meta text-ink-3">
              <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" className="flex-shrink-0" />
              {IS_DEMO
                ? 'The deployed system signs in with OpenID Connect and PKCE'
                : 'OpenID Connect, Authorization Code Flow with PKCE'}
            </p>

            {/* ── Demo accounts ─────────────────────────────────────── */}
            {/* A ruled list rather than a bordered panel. Boxed, it was the
                heaviest object on the page and outweighed the one control
                anybody came here to press. */}
            <div className="mt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-2.5">
                <h3 className="section-label">Demo accounts</h3>
                {IS_DEMO ? (
                  <span className="text-meta text-ink-3">No password needed</span>
                ) : (
                  <CopyButton
                    mono
                    value={DEMO_PASSWORD}
                    label={DEMO_PASSWORD}
                    copied={copied}
                    onCopy={handleCopy}
                  />
                )}
              </div>

              {/* In the demo the row is the control. A copy button beside a
                  username is right when the username has to be typed into
                  somebody else's login screen, and pointless when there is no
                  such screen. */}
              {IS_DEMO ? (
                <ul className="divide-y divide-rule">
                  {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.username}>
                      <button
                        type="button"
                        onClick={() => login(account.username)}
                        className="group flex w-full items-center justify-between gap-4
                                   py-2.5 text-left transition-colors hover:bg-raised
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-primary"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {account.label}
                          </span>
                          <span className="ident mt-0.5 block truncate text-meta text-ink-3">
                            {account.username} · {account.summary}
                          </span>
                        </span>
                        <ArrowRight
                          size={15}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="flex-shrink-0 text-ink-3 transition-transform
                                     group-hover:translate-x-0.5 group-hover:text-primary"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-rule">
                  {DEMO_ACCOUNTS_STATIC.map((account) => (
                    <li
                      key={account.username}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="ident truncate text-sm text-ink">{account.username}</p>
                        <p className="mt-0.5 truncate text-meta text-ink-3">
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
              )}

              <p className="note mt-4 lg:hidden">
                Every record in this deployment is fictional. Do not enter real
                patient information.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
