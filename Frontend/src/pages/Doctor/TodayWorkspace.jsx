/**
 * TodayWorkspace.jsx — the doctor's day.
 *
 * A working screen, not a report. The whole composition rests on one idea: the
 * day is a line, and the doctor is somewhere along it.
 *
 * Every appointment hangs off a single vertical rule in time order, and where
 * the clock has reached is drawn on that rule as a marked line. Above it the
 * consultations that have happened, dimmed; below it the ones still to come.
 * The next patient's row is opened out — larger time, the reason for the visit,
 * and the actions — so the question a doctor actually has between patients,
 * *who is next and what for*, is answered without reading anything else.
 *
 * The previous version was a table of rows of equal weight above four counts.
 * It was accurate and told a doctor nothing about their own day.
 *
 * The day is scoped server-side from the token's doctorId claim, so this
 * cannot be pointed at a colleague's calendar.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserX,
} from 'lucide-react'
import { addDays, format, isToday, isValid, parseISO } from 'date-fns'
import { useMyDay, useAppointmentTransition } from '../../hooks/useAppointments'
import { SkeletonRows } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/Page'
import Figures from '../../components/ui/Figures'
import { Panel } from '../../components/ui/Panel'
import { useAuth } from '../../auth/AuthProvider'

const ISO_DAY = 'yyyy-MM-dd'

/** Statuses that still hold a slot in the day. */
const OPEN = ['REQUESTED', 'CONFIRMED']

function clock(value, pattern = 'HH:mm') {
  if (!value) return '--:--'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : '--:--'
}

/* ─────────────────────────────────────────────────────────────────────────
   Day navigation
   ───────────────────────────────────────────────────────────────────────── */

function DayNavigator({ day, onChange }) {
  const date = parseISO(day)
  const today = isToday(date)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="btn-icon"
        onClick={() => onChange(format(addDays(date, -1), ISO_DAY))}
        aria-label="Previous day"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      <p className="min-w-[11rem] px-1 text-center text-sm font-medium text-ink">
        {format(date, 'EEE d MMM yyyy')}
      </p>

      <button
        type="button"
        className="btn-icon"
        onClick={() => onChange(format(addDays(date, 1), ISO_DAY))}
        aria-label="Next day"
      >
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      {/* Only offered when it would change something. */}
      {!today && (
        <button
          type="button"
          onClick={() => onChange(format(new Date(), ISO_DAY))}
          className="btn btn-secondary btn-sm ml-2"
        >
          Today
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   One appointment on the rule
   ───────────────────────────────────────────────────────────────────────── */

/**
 * @param {{ appointment: object, isNext: boolean, isPast: boolean,
 *           onTransition: Function, isPending: boolean }} props
 */
function Slot({ appointment, isNext, isPast, onTransition, isPending }) {
  const allowed = appointment.allowedTransitions || []
  const patient = appointment.patient
  const settled = !OPEN.includes(appointment.status)

  return (
    <li
      className={`spine relative py-3.5 ${isNext ? 'bg-primary-soft pr-3' : ''}`}
    >
      {/* The marker on the rule. Filled once the consultation is settled,
          hollow while it is still ahead, and ringed for the next one. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-[1.35rem] h-2 w-2 -translate-x-1/2 rounded-full
                    ${
                      isNext
                        ? 'bg-primary ring-4 ring-primary/25'
                        : settled
                          ? 'bg-closed'
                          : 'border border-rule-strong bg-surface'
                    }`}
      />

      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div className="w-16 flex-shrink-0">
          <p
            className={`ident font-medium leading-none
                        ${isNext ? 'text-lg text-ink' : isPast ? 'text-sm text-ink-3' : 'text-sm text-ink'}`}
          >
            {clock(appointment.appointmentDate)}
          </p>
          {appointment.durationMinutes != null && (
            <p className="mt-1.5 text-meta text-ink-3">
              {appointment.durationMinutes} min
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {/* The record is the doctor's next click after reading the name,
                so the name itself is the link. */}
            {patient?.id ? (
              <Link
                to={`/patients/${patient.id}`}
                className={`truncate rounded font-medium underline-offset-4 hover:underline
                            ${isPast ? 'text-ink-2' : 'text-ink'}
                            ${isNext ? 'text-base' : 'text-sm'}`}
              >
                {patient.name}
              </Link>
            ) : (
              <span className="truncate text-sm text-ink-2">
                {patient?.name || `Patient ${appointment.patientId}`}
              </span>
            )}
            <StatusBadge status={appointment.status} size="sm" />
          </div>

          {appointment.notes && (
            <p
              className={`mt-1.5 text-sm leading-relaxed text-ink-3
                          ${isNext ? '' : 'truncate'}`}
            >
              {appointment.notes}
            </p>
          )}
        </div>

        {/* Only transitions the server has said are legal. */}
        {(allowed.includes('COMPLETED') || allowed.includes('NO_SHOW') || patient?.id) && (
          <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
            {/* Only the patient in front of the doctor gets bordered
                controls. Every other row's actions are links, so the eye lands
                on the one row that is actually happening. */}
            {allowed.includes('COMPLETED') &&
              (isNext ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onTransition({ id: appointment.id, action: 'complete' })}
                  className="btn-primary btn-sm"
                >
                  <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                  Mark seen
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onTransition({ id: appointment.id, action: 'complete' })}
                  className="link-action"
                >
                  Mark seen
                </button>
              ))}
            {allowed.includes('NO_SHOW') &&
              (isNext ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onTransition({ id: appointment.id, action: 'no-show' })}
                  className="btn btn-secondary btn-sm"
                >
                  <UserX size={12} strokeWidth={2} aria-hidden="true" />
                  Did not attend
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onTransition({ id: appointment.id, action: 'no-show' })}
                  className="link-action"
                >
                  Did not attend
                </button>
              ))}
            {isNext && patient?.id && (
              <Link to={`/patients/${patient.id}`} className="btn btn-secondary btn-sm">
                <FileText size={12} strokeWidth={2} aria-hidden="true" />
                Open record
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

/** Where the clock has reached, drawn across the rule. */
function NowMarker() {
  return (
    <li className="spine relative py-1" aria-hidden="true">
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-primary-soft" />
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      <span className="relative ml-1 inline-block bg-surface pr-2 text-meta font-semibold text-primary">
        Now · {format(new Date(), 'HH:mm')}
      </span>
    </li>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The page
   ───────────────────────────────────────────────────────────────────────── */

export default function TodayWorkspace() {
  const [day, setDay] = useState(() => format(new Date(), ISO_DAY))

  // This screen is one doctor's own list, and the server builds it from the
  // doctorId claim rather than from anything sent with the request. An
  // administrator has the route but no claim, so there is no day to fetch:
  // never offer what the server will refuse.
  const { doctorId } = useAuth()
  const hasADay = doctorId !== null && doctorId !== undefined

  const { data, isLoading, isError, error } = useMyDay(day, { enabled: hasADay })
  const transition = useAppointmentTransition()

  const viewingToday = isToday(parseISO(day))

  const { rows, counts, nextId } = useMemo(() => {
    const list = [...(data?.content ?? [])].sort(
      (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
    )
    const now = Date.now()

    // "Next" is the first slot still open. On today that means the first open
    // slot at or after the clock, falling back to an open slot left behind
    // earlier in the day, because that one is what the doctor has to resolve
    // before anything else.
    const open = list.filter((row) => OPEN.includes(row.status))
    const ahead = open.filter((row) => new Date(row.appointmentDate).getTime() >= now)
    const next = viewingToday ? (ahead[0] ?? open[0]) : open[0]

    return {
      rows: list,
      nextId: next?.id ?? null,
      counts: {
        booked: list.length,
        remaining: open.length,
        seen: list.filter((row) => row.status === 'COMPLETED').length,
        missed: list.filter((row) => row.status === 'NO_SHOW').length,
      },
    }
  }, [data, viewingToday])

  // Where the "now" line goes: before the first appointment that has not
  // started yet. Only meaningful while looking at today.
  const nowIndex = useMemo(() => {
    if (!viewingToday) return -1
    const now = Date.now()
    const index = rows.findIndex((row) => new Date(row.appointmentDate).getTime() >= now)
    return index
  }, [rows, viewingToday])

  const summary = () => {
    if (isLoading) return 'Reading your list…'
    if (!hasADay) return 'You are signed in as staff rather than as a doctor, so there is no day here to show.'
    if (isError) return 'Your list could not be loaded.'
    if (!rows.length) return viewingToday ? 'Nothing is booked for you today.' : 'Nothing booked.'
    const next = rows.find((row) => row.id === nextId)
    if (!next) return 'Every appointment on this day has been accounted for.'
    return `Next at ${clock(next.appointmentDate)} — ${
      next.patient?.name || 'patient'
    }${next.notes ? `, ${next.notes.toLowerCase()}` : ''}.`
  }

  return (
    <>
      <PageHeader
        eyebrow={viewingToday ? 'Your day' : format(parseISO(day), 'EEEE')}
        title={viewingToday ? 'Today' : format(parseISO(day), 'd MMMM yyyy')}
        description={summary()}
        actions={<DayNavigator day={day} onChange={setDay} />}
        meta={
          hasADay ? (
          <Figures
            isLoading={isLoading}
            figures={[
              { label: 'Booked', value: counts.booked },
              { label: 'Still to see', value: counts.remaining },
              { label: 'Seen', value: counts.seen },
              { label: 'Did not attend', value: counts.missed, tone: 'attention' },
            ]}
          />
          ) : null
        }
      />

      <Panel>
        {/*
          Not an error, and not "nothing booked" either. An administrator does
          not have an empty day; they do not have a day at all, and saying
          "nothing booked for you today" would invite them to wonder where their
          patients went. Name the reason, and point at the screen that does
          answer the question they probably came here with.
        */}
        {!hasADay && (
          <EmptyState
            icon={CalendarDays}
            title="This screen belongs to a doctor"
            description="Today is one doctor's own list, built from the doctorId claim in their token. Your account is not a doctor's, so there is nothing to draw here. The calendar shows every doctor's day side by side."
            action={
              <Link to="/appointments/calendar" className="btn btn-secondary btn-sm">
                Open the calendar
              </Link>
            }
          />
        )}

        {hasADay && isLoading && <SkeletonRows rows={4} label="Loading your day" />}

        {hasADay && isError && (
          <div className="p-5">
            <ErrorBanner
              title="Your day could not be loaded"
              message={error?.message}
            />
          </div>
        )}

        {hasADay && !isLoading && !isError && rows.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title="Nothing booked for this day"
            description="Appointments the front desk books for you appear here, in the order you will see them."
          />
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <ol className="px-5 py-5">
            {rows.map((appointment, index) => (
              <div key={appointment.id} className="contents">
                {index === nowIndex && <NowMarker />}
                <Slot
                  appointment={appointment}
                  isNext={appointment.id === nextId}
                  isPast={nowIndex >= 0 && index < nowIndex}
                  onTransition={transition.mutate}
                  isPending={transition.isPending}
                />
              </div>
            ))}
            {/* The clock has passed everything on the list. */}
            {viewingToday && nowIndex === -1 && rows.length > 0 && <NowMarker />}
          </ol>
        )}
      </Panel>

      <p className="note mt-4 max-w-[78ch]">
        Scoped server-side from the <span className="ident">doctorId</span> claim in
        your token, so it cannot be pointed at a colleague’s calendar. Times are
        shown in the clinic’s local time zone.
      </p>
    </>
  )
}
