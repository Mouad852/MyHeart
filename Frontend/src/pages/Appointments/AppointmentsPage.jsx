/**
 * AppointmentsPage.jsx — the diary.
 *
 * What changed and why:
 *
 * The list is a diary, so it is grouped by day and sorted within the day. The
 * previous version rendered thirty appointments in whatever order the service
 * happened to return them, which put August after September after July on
 * consecutive rows. No amount of styling makes that readable; it needed sorting.
 *
 * It opens on what is ahead. A receptionist arriving at this screen is almost
 * never asking about a consultation from four months ago, and starting the list
 * in the past meant the useful rows were somewhere in the middle.
 *
 * The lifecycle is shown as tabs with live counts, so REQUESTED · 3 tells
 * somebody there is work waiting before they have clicked anything.
 *
 * Actions come from `allowedTransitions`, which the server returns on every
 * appointment. The UI never offers a move the state machine would refuse, and
 * never has to encode the rules a second time. Cancelling is behind the row
 * menu rather than sitting in a column of thirty red buttons.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Columns2,
  List,
  Search,
  UserX,
  X,
} from 'lucide-react'
import {
  addDays,
  format,
  isAfter,
  isSameDay,
  isToday,
  isTomorrow,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Menu from '../../components/ui/Menu'
import Segmented from '../../components/ui/Segmented'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/Page'
import { Panel } from '../../components/ui/Panel'
import { SkeletonRows } from '../../components/ui/LoadingSpinner'
import AppointmentForm from './AppointmentForm'
import DayGrid from './DayGrid'
import {
  useAppointments,
  useCreateAppointment,
  useAppointmentTransition,
} from '../../hooks/useAppointments'

/** Statuses that still hold time in the diary. */
const OPEN = ['REQUESTED', 'CONFIRMED']

function when(value) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

/** A day heading a clinic would actually say out loud. */
function dayLabel(date) {
  if (isToday(date)) return `Today · ${format(date, 'EEEE d MMMM')}`
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'EEEE d MMMM')}`
  return format(date, 'EEEE d MMMM yyyy')
}

/* ─────────────────────────────────────────────────────────────────────────
   One appointment
   ───────────────────────────────────────────────────────────────────────── */

function Row({ appointment, onTransition, onCancel, isPending }) {
  const date = when(appointment.appointmentDate)
  const allowed = appointment.allowedTransitions || []
  const patient = appointment.patient
  const doctor = appointment.doctor

  /**
   * The one move this row is waiting for, promoted out of the menu.
   * A requested slot wants an answer; a confirmed one that has happened wants
   * marking. Everything else has nothing pending and shows no inline control.
   */
  const primary =
    appointment.status === 'REQUESTED' && allowed.includes('CONFIRMED')
      ? { label: 'Confirm', icon: Check, action: 'confirm' }
      : appointment.status === 'CONFIRMED' &&
          allowed.includes('COMPLETED') &&
          date &&
          !isAfter(date, new Date())
        ? { label: 'Seen', icon: CircleCheck, action: 'complete' }
        : null

  const menuItems = [
    allowed.includes('CONFIRMED') &&
      primary?.action !== 'confirm' && {
        label: 'Confirm',
        icon: Check,
        onSelect: () => onTransition({ id: appointment.id, action: 'confirm' }),
      },
    allowed.includes('COMPLETED') &&
      primary?.action !== 'complete' && {
        label: 'Mark as seen',
        icon: CircleCheck,
        onSelect: () => onTransition({ id: appointment.id, action: 'complete' }),
      },
    allowed.includes('NO_SHOW') && {
      label: 'Did not attend',
      icon: UserX,
      onSelect: () => onTransition({ id: appointment.id, action: 'no-show' }),
    },
    allowed.includes('CANCELLED') && {
      label: 'Cancel appointment',
      icon: Ban,
      danger: true,
      onSelect: () => onCancel(appointment),
    },
  ].filter(Boolean)

  return (
    <li className="row-hover flex flex-wrap items-start gap-x-5 gap-y-2 px-5 py-3">
      {/* Time leads: within a day, that is the only thing being compared. */}
      <p className="ident w-14 flex-shrink-0 pt-0.5 text-sm font-medium text-ink">
        {date ? format(date, 'HH:mm') : '--:--'}
      </p>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {patient?.id ? (
            <Link
              to={`/patients/${patient.id}`}
              className="truncate rounded text-sm font-medium text-ink underline-offset-4 hover:underline"
            >
              {patient.name}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium text-ink-2">
              {patient?.name || `Patient ${appointment.patientId}`}
            </span>
          )}
          <StatusBadge status={appointment.status} size="sm" />
        </div>

        <p className="mt-0.5 truncate text-meta text-ink-3">
          {doctor?.name || `Doctor ${appointment.doctorId}`}
          {doctor?.specialty ? ` · ${doctor.specialty}` : ''}
        </p>

        {appointment.notes && (
          <p className="mt-1 max-w-[70ch] text-sm text-ink-3">{appointment.notes}</p>
        )}
      </div>

      <div className="flex w-full flex-shrink-0 items-center justify-end gap-1.5 sm:w-auto">
        {primary && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onTransition({ id: appointment.id, action: primary.action })}
            className="link-action"
          >
            {primary.label}
          </button>
        )}
        <Menu label={`Actions for ${patient?.name || 'this appointment'}`} items={menuItems} />
      </div>
    </li>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The page
   ───────────────────────────────────────────────────────────────────────── */

export default function AppointmentsPage() {
  const { data: appointments = [], isLoading, error, refetch } = useAppointments()

  const [scope, setScope] = useState('upcoming')
  // The list answers "what is next"; the day answers "where is the gap".
  // Both exist because neither can do the other's job.
  const [view, setView] = useState('list')
  const [gridDay, setGridDay] = useState(() => startOfDay(new Date()))
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [toCancel, setToCancel] = useState(null)

  const createMutation = useCreateAppointment({ onSuccess: () => setCreateOpen(false) })
  const transition = useAppointmentTransition()
  const cancelMutation = useAppointmentTransition()

  const today = startOfDay(new Date())

  /** Which appointments each tab covers, and how many there are. */
  const scopes = useMemo(() => {
    const test = {
      upcoming: (row) => {
        const date = when(row.appointmentDate)
        return OPEN.includes(row.status) && date && !isAfter(today, date)
      },
      requested: (row) => row.status === 'REQUESTED',
      today: (row) => {
        const date = when(row.appointmentDate)
        return date && isSameDay(date, today)
      },
      past: (row) => {
        const date = when(row.appointmentDate)
        return date && isAfter(today, date)
      },
      all: () => true,
    }
    return {
      test,
      counts: Object.fromEntries(
        Object.entries(test).map(([key, fn]) => [key, appointments.filter(fn).length])
      ),
    }
  }, [appointments, today])

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()

    let list = appointments.filter(scopes.test[scope])

    if (term) {
      list = list.filter((row) =>
        [row.patient?.name, row.doctor?.name, row.doctor?.specialty, row.notes]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term))
      )
    }

    // The past reads backwards from now; everything else reads forwards.
    const direction = scope === 'past' ? -1 : 1
    list.sort(
      (a, b) =>
        direction *
        ((when(a.appointmentDate)?.getTime() ?? 0) - (when(b.appointmentDate)?.getTime() ?? 0))
    )

    const days = []
    for (const row of list) {
      const date = when(row.appointmentDate)
      const key = date ? format(date, 'yyyy-MM-dd') : 'undated'
      const last = days[days.length - 1]
      if (last && last.key === key) last.rows.push(row)
      else days.push({ key, date, rows: [row] })
    }
    return days
  }, [appointments, scope, search, scopes])

  const shown = groups.reduce((sum, group) => sum + group.rows.length, 0)
  const filtering = Boolean(search.trim())

  return (
    <>
      <PageHeader
        eyebrow="Clinic"
        title="Appointments"
        description={`${scopes.counts.upcoming} still to come, out of ${appointments.length} in the diary.`}
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <CalendarPlus size={14} strokeWidth={2} aria-hidden="true" />
            Book appointment
          </button>
        }
      />

      {error && (
        <ErrorBanner
          className="mb-6"
          title="The diary could not be loaded"
          message={error.message}
          onRetry={refetch}
        />
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-3">
          <Segmented
            label="Which appointments to show"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'upcoming', label: 'Upcoming', count: scopes.counts.upcoming },
              { value: 'requested', label: 'Requested', count: scopes.counts.requested },
              { value: 'today', label: 'Today', count: scopes.counts.today },
              { value: 'past', label: 'Past', count: scopes.counts.past },
              { value: 'all', label: 'All', count: scopes.counts.all },
            ]}
          />

          <div className="mb-2 flex flex-wrap items-center gap-3 sm:mb-0">
            {/* Two views of the same diary, switched in place. */}
            {/* Below xl the two views are mutually exclusive, because there
                is not room for both. From xl up the day is always beside the
                list and this control is unnecessary. */}
            <div
              role="group"
              aria-label="How to show the diary"
              className="flex overflow-hidden rounded border border-rule-strong xl:hidden"
            >
              {[
                { value: 'list', label: 'List', icon: List },
                { value: 'day', label: 'Day', icon: Columns2 },
              ].map((option) => {
                const Icon = option.icon
                const selected = view === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setView(option.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-meta
                                transition-colors duration-fast
                                ${
                                  selected
                                    ? 'bg-primary-soft font-medium text-primary'
                                    : 'text-ink-2 hover:bg-raised hover:text-ink'
                                }`}
                  >
                    <Icon size={13} strokeWidth={2} aria-hidden="true" />
                    {option.label}
                  </button>
                )
              })}
            </div>

          <div className="relative w-full max-w-xs">
            <Search
              size={13}
              strokeWidth={2}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by patient, doctor or note"
              aria-label="Filter the diary"
              className="input h-8 bg-raised py-0 pl-8 pr-8 text-meta
 [&::-webkit-search-cancel-button]:hidden"
            />
            {filtering && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear the filter"
                className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2
                           items-center justify-center rounded text-ink-3 hover:text-ink"
              >
                <X size={12} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          </div>
        </div>

        {isLoading && <SkeletonRows rows={5} label="Loading the diary" />}

        {!isLoading && (
          <div className="grid xl:grid-cols-[minmax(0,1fr)_23rem]">
            {/* ── The list ─────────────────────────────────────────── */}
            <div className={`min-w-0 ${view === 'day' ? 'hidden xl:block' : ''}`}>
        {/* ── The list ────────────────────────────────────────────────── */}
              {shown === 0 && (

          <EmptyState
            icon={CalendarDays}
            title={
              filtering
                ? 'Nothing matches that'
                : scope === 'requested'
                  ? 'No requests waiting'
                  : 'Nothing in this part of the diary'
            }
            description={
              filtering
                ? 'Try a shorter term, or a different tab.'
                : scope === 'requested'
                  ? 'Every appointment a patient has asked for has been answered.'
                  : 'Appointments appear here as the desk books them.'
            }
            action={
              !filtering &&
              scope !== 'requested' && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(true)}
                >
                  <CalendarPlus size={14} strokeWidth={2} aria-hidden="true" />
                  Book an appointment
                </button>
              )
            }
          />
        )}

              {groups.map((group) => (
            <section key={group.key}>
              {/* The day heading is the row above its own appointments, on the
                  raised ground, so a long diary stays navigable while it
                  scrolls. */}
              <h2 className="flex items-baseline justify-between gap-4 border-b border-rule bg-raised px-5 py-2">
                <span className="text-meta font-medium text-ink-2">
                  {group.date ? dayLabel(group.date) : 'Undated'}
                </span>
                <span className="ident text-meta text-ink-3">{group.rows.length}</span>
              </h2>
              <ul className="divide-y divide-rule">
                {group.rows.map((appointment) => (
                  <Row
                    key={appointment.id}
                    appointment={appointment}
                    onTransition={transition.mutate}
                    onCancel={setToCancel}
                    isPending={transition.isPending}
                  />
                    ))}
              </ul>
            </section>
              ))}
            </div>

            {/* ── The day ──────────────────────────────────────────── */}
            <div
              className={`min-w-0 border-rule xl:border-l
                          ${view === 'day' ? '' : 'hidden xl:block'}`}
            >
        {/* ── The day ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Previous day"
                  onClick={() => setGridDay((d) => addDays(d, -1))}
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </button>
                <p className="min-w-[11rem] px-1 text-center text-sm font-medium text-ink">
                  {isToday(gridDay) ? 'Today · ' : ''}
                  {format(gridDay, 'EEE d MMM yyyy')}
                </p>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Next day"
                  onClick={() => setGridDay((d) => addDays(d, 1))}
                >
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </button>
                {!isToday(gridDay) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm ml-2"
                    onClick={() => setGridDay(startOfDay(new Date()))}
                  >
                    Today
                  </button>
                )}
              </div>
              <p className="text-meta text-ink-3">
                Booked slots drawn to length. Empty space is bookable.
              </p>
            </div>

            <div className="overflow-x-auto px-5 pb-6 pr-6 pt-5">
              <div className="min-w-[26rem]">
                <DayGrid
                  day={gridDay}
                  appointments={appointments.filter((row) => {
                    const date = when(row.appointmentDate)
                    return date && isSameDay(date, gridDay)
                  })}
                  onSelect={(appointment) => {
                    // Opening a slot from the grid drops you into the list at
                    // that day, where the actions are.
                    const date = when(appointment.appointmentDate)
                    if (date) setGridDay(startOfDay(date))
                    setView('list')
                    setScope('all')
                  }}
                />
              </div>
            </div>
            </div>
          </div>
        )}

      </Panel>

      {!isLoading && view === 'list' && shown > 0 && (
        <p className="note mt-3 max-w-[78ch]">
          The move a row is waiting for sits inline; the rest are behind the row
          menu, with the destructive one marked and separated. Slots are checked
          server-side on half-open intervals, so a booking that merely touches
          the end of another is allowed and one that overlaps is refused.
        </p>
      )}

      {filtering && shown > 0 && (
        <p className="mt-3 text-meta text-ink-3">
          {shown} {shown === 1 ? 'appointment matches' : 'appointments match'} “{search.trim()}”.
        </p>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Book an appointment"
      >
        <AppointmentForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        onConfirm={() =>
          cancelMutation.mutate(
            { id: toCancel?.id, action: 'cancel' },
            { onSuccess: () => setToCancel(null) }
          )
        }
        isLoading={cancelMutation.isPending}
        title="Cancel this appointment?"
        message={
          toCancel
            ? `${toCancel.patient?.name || 'This patient'}’s appointment on ${
                when(toCancel.appointmentDate)
                  ? format(when(toCancel.appointmentDate), 'EEEE d MMMM, HH:mm')
                  : 'the booked date'
              } will be cancelled. The slot is released and the appointment cannot be reinstated.`
            : ''
        }
        confirmLabel="Cancel the appointment"
      />
    </>
  )
}
