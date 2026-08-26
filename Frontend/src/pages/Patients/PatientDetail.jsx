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
  ChevronLeft,
  FlaskConical,
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
import Segmented from '../../components/ui/Segmented'
import { Panel, Field } from '../../components/ui/Panel'
import Avatar from '../../components/ui/Avatar'

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
   Identity
   ───────────────────────────────────────────────────────────────────────── */

function IdentityBand({ patient, isLoading }) {
  if (isLoading) {
    return (
      <Panel className="mb-6 px-5 py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2.5">
            <SkeletonText chars={20} className="h-5" />
            <SkeletonText chars={14} />
          </div>
        </div>
      </Panel>
    )
  }

  if (!patient) return null

  return (
    <Panel className="mb-6">
      {/* The teal rule down the left is the same mark the timeline hangs off:
          this band is the head of the thread, not a separate object. */}
      <div className="flex flex-wrap items-center gap-x-10 gap-y-5 border-l-2 border-teal-400 px-5 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-title font-bold text-white">
              {patient.name}
            </h1>
            <p className="ident mt-1 text-meta text-slate-500">
              Record {String(patient.id).padStart(5, '0')}
              {patient.createdAt &&
                ` · registered ${safeDate(patient.createdAt, 'd MMM yyyy')}`}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          <Field label="Email">
            {patient.email ? (
              <a href={`mailto:${patient.email}`} className="link no-underline">
                {patient.email}
              </a>
            ) : null}
          </Field>
          <Field label="Phone" mono>
            {patient.phone ? (
              <a href={`tel:${patient.phone}`} className="text-slate-100 hover:text-teal-300">
                {patient.phone}
              </a>
            ) : null}
          </Field>
        </dl>
      </div>
    </Panel>
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
                   justify-center bg-navy-900 text-slate-500"
      >
        <Icon size={13} strokeWidth={1.75} />
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="min-w-0 text-sm font-medium text-slate-100">{event.title}</p>
        <p className="flex-shrink-0 text-meta text-slate-500">
          <span className="ident">{safeDate(event.at, 'd MMM yyyy')}</span>
          {safeDate(event.at, 'HH:mm') && (
            <span className="ident"> · {safeDate(event.at, 'HH:mm')}</span>
          )}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-micro uppercase text-slate-500">{kind.label}</span>
        {event.status && <StatusBadge status={event.status} size="sm" />}
        {event.amount != null && (
          <span className="ident text-meta text-slate-300">
            {Number(event.amount).toFixed(2)} {event.currency}
          </span>
        )}
        {event.meta && <span className="text-meta text-slate-500">{event.meta}</span>}
      </div>

      {event.detail && (
        <p className="mt-2 max-w-[76ch] text-sm leading-relaxed text-slate-400">
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

  const tabs = [
    { value: 'all', label: 'Everything', count: timeline.events.length },
    ...timeline.sources.map((source) => ({
      value: source.key,
      label: source.label,
      count: source.count,
    })),
  ]

  return (
    <>
      <Link
        to="/patients"
        className="mb-5 inline-flex items-center gap-1.5 rounded text-meta text-slate-500
                   transition-colors duration-fast hover:text-teal-400"
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

      <IdentityBand patient={patient.data} isLoading={patient.isLoading} />

      {/* One banner per service that is down, naming it, in the place the
          missing rows would have been. Billing being unavailable does not make
          the appointment history look broken. */}
      {timeline.failedSources.length > 0 && (
        <div className="mb-6 space-y-3">
          {timeline.failedSources.map((source) => (
            <ErrorBanner
              key={source.key}
              variant="degraded"
              title={`${source.label} temporarily unavailable`}
              message={`This patient’s ${source.noun} are missing from the history below. Everything else is current.`}
              onRetry={source.refetch}
            />
          ))}
        </div>
      )}

      <Panel>
        <div className="border-b border-hairline px-3">
          <Segmented
            label="Filter this history"
            options={tabs}
            value={filter}
            onChange={setFilter}
          />
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
                : 'Try “Everything” to see the rest of this patient’s history.'
            }
          />
        )}

        {!timeline.isLoading && months.length > 0 && (
          <div className="px-5 py-2">
            {months.map((group) => (
              <section key={group.key}>
                {/* The month sits on the rule, breaking it, so a long history
                    reads as a series of periods rather than one endless list. */}
                <h2 className="spine relative py-3">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 bg-navy-900"
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
    </>
  )
}
