/**
 * DemoBar.jsx — the one part of the demo that admits to being one.
 *
 * It does one job the real product must never have: switching role without
 * signing out. Seven roles see seven different products here, and asking a
 * visitor to sign out and back in six times to discover that is asking too
 * much.
 *
 * It sits at the bottom because the header belongs to the product. Collapsed it
 * is one line; nothing here competes with the screen it is describing.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronUp, FlaskConical, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { homeRouteFor } from '../auth/roles'
import { DEMO_ACCOUNTS } from './config'

export default function DemoBar() {
  const { username, demo } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  if (!demo) return null

  const current = DEMO_ACCOUNTS.find((a) => a.username === username)

  const switchTo = (account) => {
    demo.signInAs(account.username)
    // Cached answers belong to the previous role and some of them would now be
    // refused. Clearing is the honest equivalent of a fresh sign-in.
    queryClient.clear()
    window.location.assign(homeRouteFor([account.role]))
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

          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="link-action inline-flex flex-shrink-0 items-center gap-1"
            >
              Switch role
              <ChevronUp size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
