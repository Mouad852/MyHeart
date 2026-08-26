/**
 * Dashboard.jsx — the clinic's operations overview.
 *
 * This screen answers three questions, in the order the person running a
 * clinic asks them: is today under control, what needs a decision from me, and
 * where is the money. It deliberately is not a wall of totals. A count of every
 * prescription ever written is a fact about the database, not about the clinic,
 * and nobody acts on it.
 *
 * Sections appear only for roles the gateway will serve, so a nurse is not
 * shown an empty money panel and a billing clerk is not shown an empty ward.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, CircleCheck, TriangleAlert } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { useClinicOverview } from '../hooks/useClinicOverview'
import { useAppointmentTransition } from '../hooks/useAppointments'
import { useAuth } from '../auth/AuthProvider'
import { Skeleton } from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import Avatar from '../components/ui/Avatar'

/** Money, in the currency the summary reports. */
function money(amount, currency) {
  const value = Number(amount ?? 0)
  if (!currency) return value.toFixed(2)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(value)
}

function clockTime(value) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'HH:mm') : null
}

function dayAndTime(value) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'd MMM, HH:mm') : null
}

/**
 * A row of figures separated by hairlines rather than wrapped in cards.
 * At this density a card around every number is chrome competing with the
 * number it contains.
 */
function FigureRow({ figures, isLoading }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label} className="bg-navy-900 px-5 py-4">
          <dt className="text-xs text-slate-500">{figure.label}</dt>
          <dd
            className={`mt-1 font-display text-2xl font-bold tabular-nums ${
              figure.tone === 'warn' && figure.value > 0 ? 'text-orange-400' : 'text-white'
            }`}
          >
            {isLoading ? <Skeleton className="h-7 w-10" /> : figure.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** The queue: appointments a patient asked for that nobody has answered yet. */
function AwaitingConfirmation({ awaiting }) {
  const transition = useAppointmentTransition()

  return (
    <section className="card overflow-hidden">
      <header className="flex items-baseline justify-between gap-4 border-b border-white/5 px-6 py-5">
        <div>
          <h2 className="font-display text-base font-bold text-white">Waiting on the desk</h2>
          <p className="mt-1 text-xs text-slate-500">
            Slots patients have asked for and nobody has answered yet.
          </p>
        </div>
        {awaiting.count > 0 && (
          <span className="font-display text-2xl font-bold tabular-nums text-amber-400">
            {awaiting.count}
          </span>
        )}
      </header>

      {awaiting.isLoading && (
        <ul className="divide-y divide-white/5" aria-busy="true" aria-label="Loading the queue">
          {[0, 1].map((row) => (
            <li key={row} className="flex items-center gap-3 px-6 py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-7 w-20" />
            </li>
          ))}
        </ul>
      )}

      {/* An empty queue is the good outcome here, so it reads as reassurance
          rather than as missing data. */}
      {!awaiting.isLoading && awaiting.rows.length === 0 && (
        <div className="flex items-center gap-3 px-6 py-8">
          <CircleCheck
            size={18}
            className="flex-shrink-0 text-teal-400"
            strokeWidth={2}
            aria-hidden="true"
          />
          <p className="text-sm text-slate-400">
            Nothing waiting. Every requested appointment has been answered.
          </p>
        </div>
      )}

      {!awaiting.isLoading && awaiting.rows.length > 0 && (
        <>
          <ul className="divide-y divide-white/5">
            {awaiting.rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 px-6 py-4 transition-colors duration-150 hover:bg-white/[0.02]"
              >
                <Avatar name={row.patient?.name || 'Patient'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {row.patient?.name || `Patient #${row.patientId}`}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {dayAndTime(row.appointmentDate)}
                    {row.doctor?.name ? ` with ${row.doctor.name}` : ''}
                  </p>
                </div>
                {(row.allowedTransitions || []).includes('CONFIRMED') && (
                  <button
                    type="button"
                    disabled={transition.isPending}
                    onClick={() => transition.mutate({ id: row.id, action: 'confirm' })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30
                               bg-teal-500/10 px-2.5 py-1.5 text-xs font-medium text-teal-400
                               transition-all duration-150 hover:border-teal-500/50 hover:bg-teal-500/20
                               focus:outline-none focus:ring-2 focus:ring-teal-400
                               focus:ring-offset-2 focus:ring-offset-navy-900
                               active:translate-y-px
                               disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check size={13} strokeWidth={2} aria-hidden="true" />
                    Confirm
                  </button>
                )}
              </li>
            ))}
          </ul>

          {awaiting.count > awaiting.rows.length && (
            <div className="border-t border-white/5 px-6 py-3">
              <Link
                to="/appointments"
                className="inline-flex items-center gap-1.5 rounded text-xs text-teal-400
                           transition-colors duration-150 hover:text-teal-300
                           focus:outline-none focus:ring-2 focus:ring-teal-400
                           focus:ring-offset-2 focus:ring-offset-navy-900"
              >
                {awaiting.count - awaiting.rows.length} more waiting
                <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/** How the clinic's invoices are split, and what is actually at risk. */
function MoneyPanel({ billing }) {
  const data = billing.data
  const currency = data?.currency

  // The bar is proportional to value, not to row count, because a single large
  // unpaid invoice matters more than a handful of small settled ones.
  const segments = [
    { key: 'ISSUED', label: 'Outstanding', className: 'bg-amber-400' },
    { key: 'PAID', label: 'Collected', className: 'bg-teal-400' },
    { key: 'REFUNDED', label: 'Refunded', className: 'bg-blue-400' },
    { key: 'VOID', label: 'Void', className: 'bg-slate-600' },
  ]
    .map((segment) => {
      const row = data?.byStatus?.find((entry) => entry.status === segment.key)
      return { ...segment, amount: Number(row?.amount ?? 0), count: row?.count ?? 0 }
    })
    .filter((segment) => segment.amount > 0)

  const total = segments.reduce((sum, segment) => sum + segment.amount, 0)

  return (
    <section className="card p-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-white">Invoiced</h2>
          <p className="mt-1 text-xs text-slate-500">
            {data?.invoiceCount != null
              ? `${data.invoiceCount} invoices raised in total.`
              : 'Across every invoice the clinic has raised.'}
          </p>
        </div>
        <Link
          to="/billing"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded text-xs text-teal-400
                     transition-colors duration-150 hover:text-teal-300
                     focus:outline-none focus:ring-2 focus:ring-teal-400
                     focus:ring-offset-2 focus:ring-offset-navy-900"
        >
          Open billing
          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
        </Link>
      </header>

      {billing.isLoading && (
        <div className="mt-6 space-y-4" aria-busy="true">
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-40" />
        </div>
      )}

      {billing.isError && (
        <div className="mt-5">
          <ErrorBanner message="Billing totals could not be loaded." />
        </div>
      )}

      {!billing.isLoading && !billing.isError && data && (
        <>
          {total > 0 && (
            <div
              className="mt-6 flex h-1.5 overflow-hidden rounded-full"
              role="img"
              aria-label={segments
                .map((segment) => `${segment.label} ${money(segment.amount, currency)}`)
                .join(', ')}
            >
              {segments.map((segment) => (
                <span
                  key={segment.key}
                  className={segment.className}
                  style={{ width: `${(segment.amount / total) * 100}%` }}
                />
              ))}
            </div>
          )}

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Outstanding</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-amber-400">
                {money(data.outstandingAmount, currency)}
              </dd>
              <p className="mt-1 text-xs text-slate-500">{data.outstandingCount} unpaid</p>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Collected</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                {money(data.collectedAmount, currency)}
              </dd>
              <p className="mt-1 text-xs text-slate-500">{data.collectedCount} settled</p>
            </div>
          </dl>

          {/* Overdue is the only number on this panel anyone has to act on, so
              it is the only one given its own block. */}
          {data.overdueCount > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4">
              <TriangleAlert
                size={16}
                className="mt-0.5 flex-shrink-0 text-rose-400"
                strokeWidth={2}
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-rose-200/85">
                <span className="font-mono font-semibold text-rose-300">
                  {money(data.overdueAmount, currency)}
                </span>{' '}
                is past its due date across {data.overdueCount}{' '}
                {data.overdueCount === 1 ? 'invoice' : 'invoices'}.
              </p>
            </div>
          )}

          {!currency && data.invoiceCount > 0 && (
            <p className="mt-4 text-xs text-slate-500">
              Invoices are held in more than one currency, so these totals are not
              added up.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default function Dashboard() {
  const { fullName, username } = useAuth()
  const { permissions, day, awaiting, billing, register } = useClinicOverview()

  const nextTime = clockTime(day.next?.appointmentDate)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            {fullName ? `Good day, ${fullName.split(' ').slice(-1)[0]}` : 'Clinic overview'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {format(new Date(), 'EEEE d MMMM yyyy')}
          </p>
        </div>

        {permissions.canReadAppointments && !day.isLoading && (
          <p className="text-sm text-slate-400">
            {day.next ? (
              <>
                Next at <span className="font-mono font-semibold text-white">{nextTime}</span>
                {day.next.patient?.name ? `, ${day.next.patient.name}` : ''}
              </>
            ) : day.booked > 0 ? (
              'Nothing further booked today.'
            ) : (
              'No appointments booked today.'
            )}
          </p>
        )}
      </header>

      {permissions.canReadAppointments && (
        <>
          {day.isError && (
            <ErrorBanner message="Today's appointments could not be loaded." />
          )}
          <FigureRow
            isLoading={day.isLoading}
            figures={[
              { label: 'Booked today', value: day.booked },
              { label: 'Still to see', value: day.remaining },
              { label: 'Seen', value: day.seen },
              { label: 'Did not attend', value: day.noShow, tone: 'warn' },
            ]}
          />
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {permissions.canReadAppointments && <AwaitingConfirmation awaiting={awaiting} />}
        {permissions.canReadBilling && <MoneyPanel billing={billing} />}
      </div>

      {/* Whoever is signed in sees at least one panel; if their role reaches
          none of them, say so instead of rendering an empty page. */}
      {!permissions.canReadAppointments && !permissions.canReadBilling && (
        <section className="card p-6">
          <h2 className="font-display text-base font-bold text-white">Nothing to show here</h2>
          <p className="mt-2 max-w-[60ch] text-sm text-slate-400">
            The account {username} does not have access to appointments or billing.
            Your work lives on the pages listed in the sidebar.
          </p>
        </section>
      )}

      {/* Register totals are background, not news, so they sit at the bottom in
          one line rather than taking a card each. */}
      {(permissions.canReadPatients || permissions.canReadDoctors) && (
        <p className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 pt-5 text-xs text-slate-500">
          {permissions.canReadPatients && (
            <Link
              to="/patients"
              className="inline-flex items-center gap-1.5 rounded transition-colors duration-150
                         hover:text-slate-300 focus:outline-none focus:ring-2
                         focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-950"
            >
              <span className="font-mono tabular-nums text-slate-300">
                {register.isLoading ? '·' : register.patients}
              </span>
              patients on the register
            </Link>
          )}
          {permissions.canReadDoctors && (
            <Link
              to="/doctors"
              className="inline-flex items-center gap-1.5 rounded transition-colors duration-150
                         hover:text-slate-300 focus:outline-none focus:ring-2
                         focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-950"
            >
              <span className="font-mono tabular-nums text-slate-300">
                {register.isLoading ? '·' : register.doctors}
              </span>
              practising doctors
            </Link>
          )}
        </p>
      )}
    </div>
  )
}
