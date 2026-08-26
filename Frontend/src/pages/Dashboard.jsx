/**
 * Dashboard.jsx — the clinic's operations overview.
 *
 * The screen answers three questions in the order the person running a clinic
 * asks them, and the layout says which one matters most:
 *
 *   Is today under control?   — one line under the title, and a row of figures.
 *   What needs a decision?    — the widest block on the page, at the top.
 *   Where is the money?       — a ledger, quiet, below.
 *
 * The three are deliberately not equal. A booking a patient asked for and
 * nobody has answered is work sitting still; a total of collected invoices is
 * a fact. Giving them the same box, the same size and the same weight — which
 * is what a grid of statistic cards does — tells the reader that nothing on the
 * page is more urgent than anything else, which is never true of a clinic.
 *
 * Sections appear only for roles the gateway will serve, so a nurse is not
 * shown an empty money panel and a billing clerk is not shown an empty ward.
 */
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { useClinicOverview } from '../hooks/useClinicOverview'
import { useAppointmentTransition } from '../hooks/useAppointments'
import { useAuth } from '../auth/AuthProvider'
import { Skeleton, SkeletonRows, SkeletonText } from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/Page'
import Figures from '../components/ui/Figures'
import { Panel, PanelHead } from '../components/ui/Panel'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'

/** Money, in whatever currency the summary reports. */
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

function at(value, pattern) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

/* ─────────────────────────────────────────────────────────────────────────
   What needs a decision
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Appointments a patient asked for that nobody has answered.
 *
 * This is the only block on the page that carries a primary action, and it is
 * the only place the count is set at display size. Both are on purpose: it is
 * the one region where looking at the screen is supposed to end in a click.
 */
function Decisions({ awaiting }) {
  const transition = useAppointmentTransition()
  const rows = awaiting.rows ?? []

  return (
    <Panel>
      <PanelHead
        title="Waiting on the desk"
        description="Slots a patient has asked for, that nobody has answered yet."
        action={
          awaiting.count > 0 && (
            <span className="font-display text-figure font-bold tabular-nums text-amber-300">
              {awaiting.count}
            </span>
          )
        }
      />

      {awaiting.isLoading && <SkeletonRows rows={2} label="Loading the queue" />}

      {awaiting.isError && (
        <div className="p-5">
          <ErrorBanner
            variant="degraded"
            title="The request queue is unavailable"
            message="Appointments could not be reached. The rest of this page is unaffected."
          />
        </div>
      )}

      {/* An empty queue is the good outcome, so it reads as reassurance rather
          than as a list that failed to load. */}
      {!awaiting.isLoading && !awaiting.isError && rows.length === 0 && (
        <EmptyState
          tone="good"
          title="Nothing waiting."
          description="Every requested appointment has been answered."
        />
      )}

      {!awaiting.isLoading && rows.length > 0 && (
        <>
          <ul className="divide-y divide-hairline">
            {rows.map((row) => (
              <li
                key={row.id}
                className="row-hover flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5"
              >
                <Avatar name={row.patient?.name || 'Patient'} size="sm" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {row.patient?.name || `Patient ${row.patientId}`}
                  </p>
                  {/* Only the clock time is set in the identifier face. A date
                      written in mono is just a date that has been made harder
                      to read. */}
                  <p className="mt-0.5 truncate text-meta text-slate-500">
                    <span className="text-slate-400">{at(row.appointmentDate, 'd MMM')}</span>
                    {' at '}
                    <span className="ident text-slate-300">
                      {at(row.appointmentDate, 'HH:mm')}
                    </span>
                    {row.doctor?.name ? ` · ${row.doctor.name}` : ''}
                  </p>
                </div>

                {/* Offered only when the server says the transition is legal.
                    A button that produces a 409 is a lie about the state
                    machine. */}
                {(row.allowedTransitions || []).includes('CONFIRMED') && (
                  <button
                    type="button"
                    disabled={transition.isPending}
                    onClick={() => transition.mutate({ id: row.id, action: 'confirm' })}
                    className="btn-row flex-shrink-0"
                  >
                    <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                    Confirm
                  </button>
                )}
              </li>
            ))}
          </ul>

          {awaiting.count > rows.length && (
            <div className="border-t border-hairline px-5 py-3">
              <Link to="/appointments?status=REQUESTED" className="link inline-flex items-center gap-1.5 text-meta">
                {awaiting.count - rows.length} more waiting
                <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The rest of the day
   ───────────────────────────────────────────────────────────────────────── */

/**
 * What is still to come today, on the spine motif used by the doctor's day and
 * the patient timeline. The same shape means the same thing everywhere in the
 * product: events in time order, hanging off a rule.
 */
function RestOfDay({ day }) {
  const upcoming = (day.rows ?? [])
    .filter((row) => ['REQUESTED', 'CONFIRMED'].includes(row.status))
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    .slice(0, 6)

  return (
    <Panel>
      <PanelHead
        title="Still to come today"
        count={day.isLoading ? null : day.remaining}
        action={
          <Link to="/appointments" className="link text-meta">
            Schedule
          </Link>
        }
      />

      {day.isLoading && <SkeletonRows rows={3} label="Loading today" />}

      {!day.isLoading && upcoming.length === 0 && (
        <EmptyState
          tone="good"
          title="The day is clear."
          description="Nothing further is booked."
        />
      )}

      {!day.isLoading && upcoming.length > 0 && (
        <ol className="px-5 py-4">
          {upcoming.map((row) => (
            <li key={row.id} className="spine pb-4 last:pb-0">
              {/* The marker sits on the rule itself, so the eye follows one
                  line down the day rather than a column of discs. */}
              <span
                aria-hidden="true"
                className={`absolute -left-[3px] top-1.5 h-[7px] w-[7px] rounded-full
                            ${row.status === 'REQUESTED' ? 'bg-amber-400' : 'bg-teal-500'}`}
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="ident text-sm font-medium text-white">
                  {at(row.appointmentDate, 'HH:mm')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-300">
                  {row.patient?.name || `Patient ${row.patientId}`}
                </span>
                {row.status === 'REQUESTED' && <StatusBadge status="REQUESTED" size="sm" />}
              </div>
              {row.doctor?.name && (
                <p className="mt-0.5 truncate text-meta text-slate-500">{row.doctor.name}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Money
   ───────────────────────────────────────────────────────────────────────── */

/**
 * The clinic's invoices.
 *
 * Two figures and, when there is one, a debt. The previous version drew a
 * four-colour proportional bar covering issued, paid, refunded and void; three
 * of those four are the accountant's business at month end and none of them is
 * anybody's business on an operations screen. What a clinic manager needs from
 * this panel is: how much is owed to us, how much came in, and how much is
 * late.
 */
function Money({ billing }) {
  const data = billing.data
  const currency = data?.currency

  const outstanding = Number(data?.outstandingAmount ?? 0)
  const collected = Number(data?.collectedAmount ?? 0)
  const settled = outstanding + collected
  const collectedShare = settled > 0 ? (collected / settled) * 100 : 0

  return (
    <Panel>
      <PanelHead
        title="Invoiced"
        description={
          data?.invoiceCount != null
            ? `${data.invoiceCount} invoices raised in total.`
            : 'Across every invoice the clinic has raised.'
        }
        action={
          <Link to="/billing" className="link inline-flex items-center gap-1.5 text-meta">
            Billing
            <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
          </Link>
        }
      />

      {billing.isLoading && (
        <div className="space-y-4 px-5 py-5" aria-busy="true">
          <Skeleton className="h-1 w-full" />
          <SkeletonText chars={12} className="h-7" />
          <SkeletonText chars={10} className="h-7" />
        </div>
      )}

      {billing.isError && (
        <div className="p-5">
          <ErrorBanner
            variant="degraded"
            title="Billing totals are unavailable"
            message="The billing service could not be reached. Everything else on this page is current."
          />
        </div>
      )}

      {!billing.isLoading && !billing.isError && data && (
        <div className="px-5 py-5">
          {/* One bar, two parts, proportional to value rather than to the
              number of invoices: a single large unpaid bill matters more than
              a handful of small settled ones. */}
          {settled > 0 && (
            <div
              className="flex h-1 overflow-hidden bg-amber-400/25"
              role="img"
              aria-label={`${money(collected, currency)} collected of ${money(settled, currency)} invoiced`}
            >
              <span className="bg-teal-400" style={{ width: `${collectedShare}%` }} />
            </div>
          )}

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-meta text-slate-500">Outstanding</dt>
              <dd className="ident mt-1.5 text-figure font-semibold text-amber-300">
                {money(outstanding, currency)}
              </dd>
              <p className="mt-1 text-meta text-slate-500">
                {data.outstandingCount} unpaid
              </p>
            </div>
            <div>
              <dt className="text-meta text-slate-500">Collected</dt>
              <dd className="ident mt-1.5 text-figure font-semibold text-white">
                {money(collected, currency)}
              </dd>
              <p className="mt-1 text-meta text-slate-500">{data.collectedCount} settled</p>
            </div>
          </dl>

          {/* The only number on this panel anyone has to act on, and so the
              only one that gets colour of its own. */}
          {data.overdueCount > 0 && (
            <p className="mt-5 border-t border-hairline pt-4 text-sm text-slate-300">
              <span className="ident font-medium text-rose-300">
                {money(data.overdueAmount, currency)}
              </span>{' '}
              is past its due date, across {data.overdueCount}{' '}
              {data.overdueCount === 1 ? 'invoice' : 'invoices'}.
            </p>
          )}

          {!currency && data.invoiceCount > 0 && (
            <p className="mt-4 text-meta text-slate-500">
              Invoices are held in more than one currency, so these totals are not
              added together.
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The page
   ───────────────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { username } = useAuth()
  const { permissions, day, awaiting, billing, register } = useClinicOverview()

  /**
   * The state of the day in one sentence, under the title.
   *
   * This replaces "Good day, Admin". A greeting is the one thing on an
   * operations screen guaranteed to be the same every morning; the sentence it
   * displaced tells a receptionist, before she has read anything else, whether
   * she needs to do something in the next hour.
   */
  const summary = () => {
    if (!permissions.canReadAppointments) return 'What is happening in the clinic today.'
    if (day.isLoading) return 'Reading today’s list…'

    if (day.next) {
      const time = at(day.next.appointmentDate, 'HH:mm')
      const who = day.next.patient?.name
      const rest =
        day.remaining > 1 ? ` ${day.remaining} still to be seen.` : ' The last of the day.'
      return who ? `Next at ${time} — ${who}.${rest}` : `Next appointment at ${time}.${rest}`
    }

    // Slots can still be open after their time has passed: the appointment was
    // never completed and never marked as a no-show. Saying "everyone has been
    // accounted for" while a row sits in the list below is the kind of small
    // contradiction that teaches people to stop reading the summary.
    if (day.remaining > 0) {
      return day.remaining === 1
        ? 'One appointment from earlier today is still open.'
        : `${day.remaining} appointments from earlier today are still open.`
    }

    if (day.booked > 0) return 'Everyone booked for today has been seen or accounted for.'
    return 'Nothing is booked for today.'
  }

  return (
    <>
      <PageHeader
        eyebrow={format(new Date(), 'EEEE d MMMM yyyy')}
        title="Overview"
        description={summary()}
        meta={
          permissions.canReadAppointments && (
            <Figures
              isLoading={day.isLoading}
              figures={[
                { label: 'Booked today', value: day.booked },
                { label: 'Still to see', value: day.remaining },
                { label: 'Seen', value: day.seen },
                { label: 'Did not attend', value: day.noShow, tone: 'miss' },
              ]}
            />
          )
        }
      />

      {permissions.canReadAppointments && day.isError && (
        <ErrorBanner
          className="mb-6"
          title="Today’s appointments could not be loaded"
          message="The figures above and the day’s list are missing until the appointment service responds."
        />
      )}

      <div className="space-y-6">
        {/* Widest block, first on the page: the work that is sitting still. */}
        {permissions.canReadAppointments && <Decisions awaiting={awaiting} />}

        {/* `items-start` so a short list does not inherit the height of a tall
            panel beside it and end in a block of empty ground. */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {permissions.canReadAppointments && <RestOfDay day={day} />}
          {permissions.canReadBilling && <Money billing={billing} />}
        </div>

        {!permissions.canReadAppointments && !permissions.canReadBilling && (
          <Panel>
            <div className="px-5 py-6">
              <h2 className="text-sm font-semibold text-white">Nothing to show here</h2>
              <p className="mt-2 max-w-[60ch] text-sm text-slate-400">
                The account <span className="ident text-slate-300">{username}</span> does
                not reach appointments or billing. Your work lives on the pages listed in
                the sidebar.
              </p>
            </div>
          </Panel>
        )}

        {/* Register totals are background, not news: one line, at the bottom,
            rather than two more boxes competing with the day. */}
        {(permissions.canReadPatients || permissions.canReadDoctors) && (
          <p className="flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-hairline pt-5 text-meta text-slate-500">
            {permissions.canReadPatients && (
              <Link to="/patients" className="inline-flex items-center gap-2 rounded hover:text-slate-300">
                <span className="ident text-slate-300">
                  {register.isLoading ? '·' : register.patients}
                </span>
                patients on the register
              </Link>
            )}
            {permissions.canReadDoctors && (
              <Link to="/doctors" className="inline-flex items-center gap-2 rounded hover:text-slate-300">
                <span className="ident text-slate-300">
                  {register.isLoading ? '·' : register.doctors}
                </span>
                practising doctors
              </Link>
            )}
          </p>
        )}
      </div>
    </>
  )
}
