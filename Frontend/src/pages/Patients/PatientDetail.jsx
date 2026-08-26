/**
 * PatientDetail.jsx — one patient, and everything that has happened to them.
 *
 * The point of this screen is that a clinician stops opening four tabs. The
 * history is assembled from appointments, invoices, prescriptions and
 * laboratory work, and shown as one thread in time order.
 */
import React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  FlaskConical,
  Mail,
  Phone,
  Pill,
  ReceiptText,
  TriangleAlert,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { usePatient } from '../../hooks/usePatients'
import { usePatientTimeline, EVENT_KIND } from '../../hooks/usePatientTimeline'
import { Skeleton } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import Avatar from '../../components/ui/Avatar'

/** How each kind of event presents itself on the rail. */
const KIND_STYLE = {
  [EVENT_KIND.APPOINTMENT]: {
    icon: CalendarDays,
    ring: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
    label: 'Appointment',
  },
  [EVENT_KIND.INVOICE]: {
    icon: ReceiptText,
    ring: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    label: 'Billing',
  },
  [EVENT_KIND.PRESCRIPTION]: {
    icon: Pill,
    ring: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    label: 'Prescription',
  },
  [EVENT_KIND.LAB]: {
    icon: FlaskConical,
    ring: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
    label: 'Laboratory',
  },
}

function safeDate(value, pattern) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

function TimelineEvent({ event, isLast }) {
  const style = KIND_STYLE[event.kind]
  const Icon = style.icon
  const day = safeDate(event.at, 'd MMM yyyy')
  const time = safeDate(event.at, 'HH:mm')

  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {/* The rail: a single line rather than a border on every card */}
      {!isLast && (
        <span
          className="absolute left-[19px] top-10 bottom-0 w-px bg-white/10"
          aria-hidden="true"
        />
      )}

      <span
        className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center
                    rounded-xl border ${style.ring}`}
      >
        <Icon size={17} strokeWidth={2} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-medium text-slate-100">{event.title}</p>
          <p className="font-mono text-xs text-slate-500">
            {day}
            {time ? ` · ${time}` : ''}
          </p>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">{style.label}</span>
          {event.status && <StatusBadge status={event.status} />}
          {event.amount != null && (
            <span className="font-mono text-xs text-slate-300">
              {Number(event.amount).toFixed(2)} {event.currency}
            </span>
          )}
          {event.meta && <span className="text-xs text-slate-500">{event.meta}</span>}
        </div>

        {event.detail && (
          <p className="mt-2 max-w-[70ch] text-xs leading-relaxed text-slate-400">
            {event.detail}
          </p>
        )}
      </div>
    </li>
  )
}

function IdentityCard({ patient }) {
  const rows = [
    { icon: Mail, value: patient?.email },
    { icon: Phone, value: patient?.phone },
  ].filter((row) => row.value)

  return (
    <section className="card p-6">
      <div className="flex items-center gap-4">
        <Avatar name={patient?.name || 'Patient'} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-bold text-white">
            {patient?.name}
          </h2>
          <p className="mt-0.5 font-mono text-xs text-slate-500">
            Record #{String(patient?.id).padStart(5, '0')}
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t border-white/5 pt-5">
        {rows.map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-2.5">
            <Icon size={14} className="flex-shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
            <dd className="truncate text-sm text-slate-300">{value}</dd>
          </div>
        ))}
        {patient?.createdAt && (
          <div className="flex items-center gap-2.5">
            <CalendarDays size={14} className="flex-shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
            <dd className="text-sm text-slate-300">
              Registered {safeDate(patient.createdAt, 'd MMM yyyy')}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const patientId = Number(id)

  const patient = usePatient(patientId)
  const timeline = usePatientTimeline(patientId)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500
                   transition-colors duration-150 hover:text-teal-400
                   focus:outline-none focus:ring-2 focus:ring-teal-400
                   focus:ring-offset-2 focus:ring-offset-navy-950 rounded"
      >
        <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
        All patients
      </Link>

      {patient.isError && <ErrorBanner message={patient.error?.message} />}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          {patient.isLoading ? (
            <div className="card space-y-4 p-6">
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            patient.data && <IdentityCard patient={patient.data} />
          )}

          {/* Counts, so the thread below has context before it is read */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5">
            {[
              { label: 'Appointments', value: timeline.counts.appointments },
              { label: 'Invoices', value: timeline.counts.invoices },
              { label: 'Prescriptions', value: timeline.counts.prescriptions },
              { label: 'Lab tests', value: timeline.counts.labs },
            ].map((stat) => (
              <div key={stat.label} className="bg-navy-900 px-4 py-3">
                <dt className="text-[11px] text-slate-500">{stat.label}</dt>
                <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-white">
                  {timeline.isLoading ? <Skeleton className="h-6 w-8" /> : stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="card p-6">
          <h3 className="font-display text-base font-bold text-white">History</h3>
          <p className="mt-1 text-xs text-slate-500">
            Appointments, prescriptions, laboratory work and billing, most recent first.
          </p>

          {timeline.failedSources.length > 0 && (
            <div
              role="status"
              className="mt-5 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5"
            >
              <TriangleAlert
                size={16}
                className="mt-0.5 flex-shrink-0 text-amber-400"
                strokeWidth={2}
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-amber-200/80">
                Could not load {timeline.failedSources.join(', ')}. The rest of this
                history is shown below.
              </p>
            </div>
          )}

          {timeline.isLoading && (
            <ul className="mt-6 space-y-8" aria-busy="true" aria-label="Loading history">
              {[0, 1, 2].map((row) => (
                <li key={row} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!timeline.isLoading && timeline.events.length === 0 && (
            <div className="py-8">
              <EmptyState
                icon={CalendarDays}
                title="Nothing recorded yet"
                description="Appointments, prescriptions and invoices for this patient will appear here."
              />
            </div>
          )}

          {!timeline.isLoading && timeline.events.length > 0 && (
            <ul className="mt-6">
              {timeline.events.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isLast={index === timeline.events.length - 1}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
