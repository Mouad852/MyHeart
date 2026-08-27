/**
 * DemoBar.jsx — the one part of the demo that admits to being one.
 *
 * It does two jobs a hosted portfolio demo needs and the real product must
 * never have:
 *
 *   Switching role without signing out. Seven roles see seven different
 *   products here, and asking a visitor to sign out and back in six times to
 *   discover that is asking too much.
 *
 *   Turning a service off. The product treats partial failure as a designed
 *   state — one service down names itself in place, with a retry, while the
 *   rest of the screen keeps working, and a failed source's count reads as
 *   unknown rather than as zero. Against a running backend none of that can be
 *   shown without breaking something on purpose.
 *
 * It sits at the bottom because the header belongs to the product. Collapsed it
 * is one line; nothing here competes with the screen it is describing.
 */
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronUp, FlaskConical, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { homeRouteFor } from '../auth/roles'
import { DEMO_ACCOUNTS } from './config'
import { SERVICES, clearOutages, downServices, subscribe, toggleService } from './store'

export default function DemoBar() {
  const { username, demo } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [down, setDown] = useState(() => downServices())

  // The switches live outside React, so the bar subscribes rather than owning
  // them: the adapter has to read them on a request that React is not driving.
  useEffect(() => subscribe(() => setDown(downServices())), [])

  if (!demo) return null

  const current = DEMO_ACCOUNTS.find((a) => a.username === username)

  const switchTo = (account) => {
    demo.signInAs(account.username)
    // Cached answers belong to the previous role and some of them would now be
    // refused. Clearing is the honest equivalent of a fresh sign-in.
    queryClient.clear()
    window.location.assign(homeRouteFor([account.role]))
  }

  const flip = (key) => {
    toggleService(key)
    queryClient.invalidateQueries()
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div
        className="pointer-events-auto w-full max-w-[52rem] rounded border border-rule
                   bg-surface shadow-overlay"
      >
        {open && (
          <div className="border-b border-rule px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="section-label">Signed in as</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="link-action inline-flex items-center gap-1"
              >
                <X size={12} strokeWidth={2} aria-hidden="true" />
                Close
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((account) => {
                const active = account.username === username
                return (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => (active ? null : switchTo(account))}
                    aria-current={active ? 'true' : undefined}
                    className={`rounded-sm border px-2.5 py-1 text-sm transition-colors
                      ${
                        active
                          ? 'border-primary bg-primary/10 font-semibold text-primary'
                          : 'border-rule text-ink-2 hover:bg-raised hover:text-ink'
                      }`}
                  >
                    {account.label}
                  </button>
                )
              })}
            </div>

            <h2 className="section-label mt-5">Take a service down</h2>
            <p className="mt-1 text-meta text-ink-3">
              The screen keeps working; the part that cannot be read says so and
              offers a retry, and its count reads as unknown rather than as zero.
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SERVICES.map((service) => {
                const isDown = down.includes(service.key)
                return (
                  <button
                    key={service.key}
                    type="button"
                    onClick={() => flip(service.key)}
                    aria-pressed={isDown}
                    className={`rounded-sm border px-2.5 py-1 text-sm transition-colors
                      ${
                        isDown
                          ? 'border-critical bg-critical/10 font-semibold text-critical'
                          : 'border-rule text-ink-2 hover:bg-raised hover:text-ink'
                      }`}
                  >
                    {service.label}
                    {isDown && ' · down'}
                  </button>
                )
              })}
              {down.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearOutages()
                    queryClient.invalidateQueries()
                  }}
                  className="link-action px-1"
                >
                  Bring everything back
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <p className="flex min-w-0 items-center gap-2 text-meta text-ink-2">
            <FlaskConical
              size={13}
              strokeWidth={2}
              aria-hidden="true"
              className="flex-shrink-0 text-ink-3"
            />
            <span className="truncate">
              Demo · the interface on fixture data, no back end.{' '}
              <span className="text-ink-3">
                {current ? `${current.label}.` : ''} Reload to reset.
              </span>
            </span>
          </p>

          <div className="flex flex-shrink-0 items-center gap-3">
            {down.length > 0 && (
              <span className="text-meta font-semibold text-critical">
                {down.length} service{down.length > 1 ? 's' : ''} down
              </span>
            )}
            {!open && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="link-action inline-flex items-center gap-1"
              >
                Switch role
                <ChevronUp size={12} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
