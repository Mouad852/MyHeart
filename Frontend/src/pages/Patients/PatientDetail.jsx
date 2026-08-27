/**
 * PatientDetail.jsx — one patient, and everything that has happened to them.
 *
 * The point of this screen is that a clinician stops opening four tabs. Their
 * history is assembled from four services — appointments, prescriptions,
 * laboratory work and billing — and read as one thread in time order.
 *
 * Two things drive the layout.
 *
 * The thread gets the width. It used to sit in the right-hand two thirds of a
 * two-column grid, next to a 300px card holding an email address and a phone
 * number, so the most valuable content on the most important screen in the
 * product was the part that had been squeezed. Identity is a band across the
 * top now — it is four short facts, and it reads perfectly well on one line —
 * and the history has the whole page.
 *
 * Colour is not how you tell an appointment from a lab test. Each kind of event
 * carries a small glyph on the rule and its name in words; the colour on the
 * row belongs to the *status*, which is the part that might need something from
 * the reader. Four services rendered in four accent colours produced a thread
 * where the teal, amber, blue and violet said only which database a row came
 * from — information no clinician has ever needed.
 *
 * Any one of those services can be down while the others are fine. When that
 * happens the screen says which part is missing, in place, and keeps the rest
 * usable.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  FlaskConical,
  Pencil,
  Pill,
  ReceiptText,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { usePatient } from '../../hooks/usePatients'
import { usePatientTimeline, EVENT_KIND } from '../../hooks/usePatientTimeline'
import { Skeleton, SkeletonText } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import { Panel, Field } from '../../components/ui/Panel'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import PatientForm from './PatientForm'
import AppointmentForm from '../Appointments/AppointmentForm'
import { useUpdatePatient } from '../../hooks/usePatients'
import { useCreateAppointment } from '../../hooks/useAppointments'
import { formatPhone, reference } from '../../utils'

/** The glyph and the word for each kind of event. No colour. */
const KIND = {
  [EVENT_KIND.APPOINTMENT]: { icon: CalendarDays, label: 'Appointment' },
  [EVENT_KIND.PRESCRIPTION]: { icon: Pill, label: 'Prescription' },
  [EVENT_KIND.LAB]: { icon: FlaskConical, label: 'Laboratory' },
  [EVENT_KIND.INVOICE]: { icon: ReceiptText, label: 'Billing' },
}

function safeDate(value, pattern) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

/* ─────────────────────────────────────────────────────────────────────────
   Identity — the Storyboard rail
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Who this is, pinned.
 *
 * Epic's single most visible interface change in a decade was moving the
 * patient banner out of a strip across the top and into a column that never
 * leaves the screen, and the reason they gave was not aesthetic: it removes
 * scrolling, clicks and page jumps, and keeps the clinician oriented while they
 * work inside a sub-view. This record has forty-five events on it. A band above
 * them is gone by the second screenful, and a clinician reading an invoice from
 * March has no way to check whose invoice it is without scrolling back.
 *
 * So the rail sticks. It carries identity, the two ways to contact this person,
 * what the record is made of, and nothing else — a rail that grows becomes a
 * second page competing with the first.
 */
function StoryboardRail({
  patient,
  isLoading,
  sources,
  totalEvents,
  activeFilter,
  onFilter,
  onBook,
  onEdit,
}) {
  if (isLoading) {
    return (
      <aside className="panel p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <SkeletonText chars={16} className="h-5" />
            <SkeletonText chars={12} />
          </div>
        </div>
      </aside>
    )
  }

  if (!patient) return null

  return (
    <aside className="panel lg:sticky lg:top-[4.5rem]">
      {/* The rule down the left is the same mark the thread hangs off: the rail
          is the head of the record, not a separate object beside it. */}
      <div className="border-l-2 border-primary">
        <div className="flex items-start gap-3.5 px-5 pb-4 pt-5">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0 pt-0.5">
            <h1 className="text-xl font-semibold leading-tight text-ink">{patient.name}</h1>
            <p className="ident mt-1.5 text-meta text-ink-3">
              {reference('P', patient.id)}
            </p>
          </div>
        </div>

        <dl className="space-y-4 border-t border-rule px-5 py-4">
          <Field label="Email">
            {patient.email ? (
              <a href={`mailto:${patient.email}`} className="link break-all no-underline">
                {patient.email}
              </a>
            ) : null}
          </Field>
          <Field label="Phone" mono>
            {patient.phone ? (
              <a href={`tel:${patient.phone}`} className="text-ink hover:text-primary">
                {formatPhone(patient.phone)}
              </a>
            ) : null}
          </Field>
          {patient.createdAt && (
            <Field label="Registered" mono>
              {safeDate(patient.createdAt, 'd MMM yyyy')}
            </Field>
          )}
        </dl>

        {/* What the record is made of, and a way straight into each part. A
            count that cannot be clicked is a fact; one that filters the thread
            beneath it is a control. */}
        <div className="border-t border-rule px-5 py-4">
          <p className="section-label mb-2.5">In this record</p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onFilter('all')}
                aria-pressed={activeFilter === 'all'}
                className={`flex w-full items-baseline justify-between gap-3 rounded
                            px-2 py-1 text-sm transition-colors duration-fast
                            ${
                              activeFilter === 'all'
                                ? 'bg-primary-soft font-medium text-primary'
                                : 'text-ink-2 hover:bg-raised hover:text-ink'
                            }`}
              >
                <span>Everything</span>
                <span className="ident text-meta">{totalEvents}</span>
              </button>
            </li>
            {sources.map((source) => {
              const selected = activeFilter === source.key
              return (
                <li key={source.key}>
                  <button
                    type="button"
                    onClick={() => onFilter(selected ? 'all' : source.key)}
                    aria-pressed={selected}
                    className={`flex w-full items-baseline justify-between gap-3 rounded
                                px-2 py-1 text-sm transition-colors duration-fast
                                ${
                                  selected
                                    ? 'bg-primary-soft font-medium text-primary'
                                    : 'text-ink-2 hover:bg-raised hover:text-ink'
                                }`}
                  >
                    <span>{source.label}</span>
                    <span className="ident text-meta">
                      {source.isError ? (
                        <span title="This service is unavailable">—</span>
                      ) : (
                        source.count
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* A record you can only read is half a record. These are the two
            things a clinician does next after looking at one, so they sit at
            the foot of the rail rather than somewhere else on the page. */}
        <div className="flex flex-col gap-2 border-t border-rule px-5 py-4">
          <button type="button" className="btn-primary w-full" onClick={onBook}>
            <CalendarPlus size={14} strokeWidth={2} aria-hidden="true" />
            Book appointment
          </button>
          <button type="button" className="btn-secondary w-full" onClick={onEdit}>
            <Pencil size={13} strokeWidth={2} aria-hidden="true" />
            Edit details
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The thread
   ───────────────────────────────────────────────────────────────────────── */

function Event({ event }) {
  const kind = KIND[event.kind]
  const Icon = kind.icon

  return (
    <li className="spine relative py-4">
      {/* The glyph sits on the rule and paints over it, so the line reads as
          continuous and the marker as a stop along it. */}
      <span
        aria-hidden="true"
        className="absolute -left-[9px] top-[1.15rem] flex h-[18px] w-[18px] items-center
                   justify-center bg-surface text-ink-3"
      >
        <Icon size={13} strokeWidth={1.75} />
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="min-w-0 text-sm font-medium text-ink">{event.title}</p>
        <p className="flex-shrink-0 text-meta text-ink-3">
          <span className="ident">{safeDate(event.at, 'd MMM yyyy')}</span>
          {safeDate(event.at, 'HH:mm') && (
            <span className="ident"> · {safeDate(event.at, 'HH:mm')}</span>
          )}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-meta text-ink-3">{kind.label}</span>
        {event.status && <StatusBadge status={event.status} size="sm" />}
        {event.amount != null && (
          <span className="ident text-meta text-ink-2">
            {Number(event.amount).toFixed(2)} {event.currency}
          </span>
        )}
        {event.meta && <span className="text-meta text-ink-3">{event.meta}</span>}
      </div>

      {event.detail && (
        <p className="mt-2 max-w-[76ch] text-sm leading-relaxed text-ink-2">
          {event.detail}
        </p>
      )}
    </li>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const patientId = Number(id)

  const patient = usePatient(patientId)
  const timeline = usePatientTimeline(patientId)
  const [filter, setFilter] = useState('all')
  const [booking, setBooking] = useState(false)
  const [editing, setEditing] = useState(false)

  const updatePatient = useUpdatePatient({ onSuccess: () => setEditing(false) })
  const createAppointment = useCreateAppointment({ onSuccess: () => setBooking(false) })

  const events = useMemo(
    () =>
      filter === 'all'
        ? timeline.events
        : timeline.events.filter((event) => event.kind === filter),
    [timeline.events, filter]
  )

  /** Events grouped under the month they happened in. */
  const months = useMemo(() => {
    const groups = []
    for (const event of events) {
      const key = safeDate(event.at, 'MMMM yyyy') || 'Undated'
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.events.push(event)
      else groups.push({ key, events: [event] })
    }
    return groups
  }, [events])


  return (
    <>
      <Link
        to="/patients"
        className="mb-5 inline-flex items-center gap-1.5 rounded text-meta text-ink-3
                   transition-colors duration-fast hover:text-primary"
      >
        <ChevronLeft size={13} strokeWidth={2} aria-hidden="true" />
        All patients
      </Link>

      {patient.isError && (
        <ErrorBanner
          className="mb-6"
          title="This patient could not be loaded"
          message={patient.error?.message}
          onRetry={patient.refetch}
        />
      )}

      {/* Two columns from `lg`: the rail on the left, the record on the right.
          Below that they stack, rail first, because on a phone the first thing
          you need is still to know whose record you opened. */}
      <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <StoryboardRail
          patient={patient.data}
          isLoading={patient.isLoading}
          sources={timeline.sources}
          totalEvents={timeline.events.length}
          activeFilter={filter}
          onFilter={setFilter}
          onBook={() => setBooking(true)}
          onEdit={() => setEditing(true)}
        />

        <div className="min-w-0">
          {/* One banner per service that is down, naming it, where the missing
              rows would have been. Billing being unavailable does not make the
              appointment history look broken. */}
          {timeline.failedSources.length > 0 && (
            <div className="mb-6 space-y-3">
              {timeline.failedSources.map((source) => (
                <ErrorBanner
                  key={source.key}
                  variant="degraded"
                  title={`${source.label} temporarily unavailable`}
                  message={`This patient's ${source.noun} are missing from the history below. Everything else is current.`}
                  onRetry={source.refetch}
                />
              ))}
            </div>
          )}

          <Panel>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1
                            border-b border-rule px-5 py-3.5">
              <h2 className="text-sm font-semibold text-ink">
                {filter === 'all'
                  ? 'History'
                  : (timeline.sources.find((s) => s.key === filter)?.label ?? 'History')}
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="ident text-meta text-ink-3">{events.length}</span>
                {filter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className="link text-meta"
                  >
                    Show everything
                  </button>
                )}
              </div>
            </div>

            {timeline.isLoading && (
              <ul className="px-5 py-5" aria-busy="true" aria-label="Loading history">
                {[0, 1, 2].map((row) => (
                  <li key={row} className="spine py-4">
                    <SkeletonText chars={34} className="h-4" />
                    <SkeletonText chars={16} className="mt-2.5 opacity-60" />
                  </li>
                ))}
              </ul>
            )}

            {!timeline.isLoading && events.length === 0 && (
              <EmptyState
                icon={CalendarDays}
                title={
                  filter === 'all'
                    ? 'Nothing recorded for this patient yet'
                    : 'Nothing of this kind recorded yet'
                }
                description={
                  filter === 'all'
                    ? 'Appointments, prescriptions, laboratory work and invoices appear here as they happen.'
                    : 'Choose "Everything" to see the rest of this patient\u2019s history.'
                }
              />
            )}

            {!timeline.isLoading && months.length > 0 && (
              <div className="px-5 py-2">
                {months.map((group) => (
                  <section key={group.key}>
                    {/* The month sits on the rule and breaks it, so a long
                        history reads as a series of periods rather than one
                        endless list. */}
                    <h2 className="spine relative py-3">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 bg-surface"
                      />
                      <span className="section-label">{group.key}</span>
                    </h2>
                    <ol>
                      {group.events.map((event) => (
                        <Event key={event.id} event={event} />
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            )}
          </Panel>

          <p className="note mt-3 max-w-[78ch]">
            Assembled in the browser from four services. Each is fetched
            independently, so one being unavailable names itself above and leaves
            the rest of the record readable.
          </p>
        </div>
      </div>

      <Modal
        isOpen={booking}
        onClose={() => setBooking(false)}
        title="Book an appointment"
        description={patient.data ? `For ${patient.data.name}` : undefined}
      >
        <AppointmentForm
          initialPatientId={patientId}
          onSubmit={(data) => createAppointment.mutate(data)}
          isLoading={createAppointment.isPending}
        />
      </Modal>

      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Edit patient details"
      >
        <PatientForm
          initialData={patient.data}
          onSubmit={(data) => updatePatient.mutate({ id: patientId, data })}
          isLoading={updatePatient.isPending}
        />
      </Modal>
    </>
  )
}
