/**
 * MyHealth.jsx — the patient's own view of their care.
 *
 * This is the one screen in MedCore that is not for staff, and it is built to a
 * different brief. A receptionist wants density; a patient wants one answer.
 * Nine times out of ten the answer is *when is my next appointment*, so that is
 * the largest thing on the page, given in the terms a person actually thinks in
 * — "In three days · Thursday 27 August · 09:00" — and everything else is
 * arranged beneath it.
 *
 * The previous version listed twenty appointments of equal weight, past and
 * future together, which meant the one that mattered had to be found by reading.
 *
 * Two smaller things, both about not showing a patient the clinic's plumbing:
 *
 *   The lifecycle is renamed. "Requested" is how the clinic's state machine
 *   describes a slot nobody has answered; to the person who asked for it, the
 *   truthful phrase is "Awaiting confirmation".
 *
 *   When the doctor's name cannot be read — the gateway does not serve the
 *   doctor register to a patient, so the enrichment falls back — the line is
 *   omitted. It used to print the literal fallback string "Unavailable" against
 *   every appointment, which told the patient nothing except that something had
 *   gone wrong.
 *
 * Everything here is scoped server-side: patient-service returns only the record
 * matching the patientId claim, and appointment-service narrows the query to the
 * same id. Nothing is filtered in the browser.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, FileDown, UserRound } from 'lucide-react'
import {
  differenceInCalendarDays,
  format,
  isAfter,
  isValid,
  parseISO,
} from 'date-fns'
import { useAuth } from '../../auth/AuthProvider'
import patientApi from '../../services/patientApi'
import appointmentApi from '../../services/appointmentApi'
import { Skeleton, SkeletonText } from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/Page'
import { Panel, PanelHead, Field } from '../../components/ui/Panel'
import { formatPhone } from '../../utils'
import {
  usePrescriptionsByPatient,
  usePrescriptionDocument,
} from '../../hooks/usePrescriptions'
import {
  useLabRequestsByPatient,
  useLabResults,
  useDownloadLabResultFile,
} from '../../hooks/useLabs'
import { Spinner } from '../../components/ui/LoadingSpinner'

/** How the clinic's states are named to the person they concern. */
const PATIENT_TEST_WORDING = {
  PENDING: 'Waiting for your sample',
  IN_PROGRESS: 'At the laboratory',
  COMPLETED: 'Result ready',
  CANCELLED: 'Cancelled',
}

const PATIENT_WORDING = {
  REQUESTED: 'Awaiting confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Attended',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Missed',
}

function on(value, pattern) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

/**
 * The doctor, if it is genuinely known.
 *
 * `Unavailable` is the circuit breaker's fallback leaking through, not a
 * person's name.
 */
function doctorLine(appointment) {
  const name = appointment.doctor?.name
  if (!name || name.toLowerCase() === 'unavailable') return null
  const specialty = appointment.doctor?.specialty
  return specialty && specialty.toLowerCase() !== 'unavailable'
    ? `${name} · ${specialty}`
    : name
}

/** "Today", "Tomorrow", "In 3 days", "In 5 weeks". */
function howSoon(date) {
  const days = differenceInCalendarDays(date, new Date())
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 14) return `In ${days} days`
  if (days < 60) return `In ${Math.round(days / 7)} weeks`
  return `In ${Math.round(days / 30)} months`
}

/* ─────────────────────────────────────────────────────────────────────────
   The next appointment
   ───────────────────────────────────────────────────────────────────────── */

function NextAppointment({ appointment }) {
  const date = parseISO(appointment.appointmentDate)
  const doctor = doctorLine(appointment)

  return (
    <Panel className="mb-6">
      <div className="border-l-2 border-primary px-5 py-6 sm:px-7 sm:py-7">
        <p className="section-label">Your next appointment</p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <p className="text-figure font-bold text-ink">{howSoon(date)}</p>
          <p className="text-lg text-ink-2">{format(date, 'EEEE d MMMM')}</p>
          <p className="ident text-lg font-medium text-ink">{format(date, 'HH:mm')}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge
            status={appointment.status}
            label={PATIENT_WORDING[appointment.status]}
          />
          {doctor && <span className="text-portal text-ink-2">{doctor}</span>}
        </div>

        {appointment.notes && (
          <p className="mt-4 max-w-[62ch] text-portal leading-relaxed text-ink-2">
            {appointment.notes}
          </p>
        )}

        {appointment.status === 'REQUESTED' && (
          <p className="mt-5 border-t border-rule pt-4 text-sm text-ink-3">
            You asked for this time. The clinic will confirm it, and this page will
            say so once they have.
          </p>
        )}
      </div>
    </Panel>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   A row in one of the lists
   ───────────────────────────────────────────────────────────────────────── */

function Row({ appointment, dim = false }) {
  const doctor = doctorLine(appointment)

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3.5
                  ${dim ? 'text-ink-3' : ''}`}
    >
      <div className="min-w-0">
        <p className={`text-portal ${dim ? 'text-ink-2' : 'font-medium text-ink'}`}>
          {on(appointment.appointmentDate, 'EEEE d MMMM yyyy')}
          {' · '}
          <span className="ident">{on(appointment.appointmentDate, 'HH:mm')}</span>
        </p>
        {(doctor || appointment.notes) && (
          <p className="mt-1 truncate text-sm text-ink-3">
            {[doctor, appointment.notes].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <StatusBadge
        size="sm"
        status={appointment.status}
        label={PATIENT_WORDING[appointment.status]}
      />
    </li>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Prescriptions and results

   The API has served these to a patient since the ownership checks went in —
   prescription-service and lab-service both narrow to the patientId claim and
   refuse anything that is not the caller's own. Nothing in the interface
   admitted it, so a patient could not read a prescription the system was
   perfectly willing to give them.

   They are not the staff screens with the controls removed. A patient does not
   file results, order tests or write prescriptions; they read what was written
   about them and take a copy away. So these are read-only, in the portal's
   larger type, with the one action that matters on each — the printed
   document, and the report file.
   ───────────────────────────────────────────────────────────────────────── */

function PortalPrescriptions({ patientId }) {
  const { data: rows = [], isLoading, isError, refetch } = usePrescriptionsByPatient(patientId)
  const print = usePrescriptionDocument()

  if (isLoading || (!isError && rows.length === 0)) return null

  return (
    <Panel>
      <PanelHead title="Your prescriptions" count={rows.length} />

      {isError ? (
        <div className="px-5 py-4">
          <ErrorBanner
            variant="degraded"
            title="Your prescriptions are unavailable"
            message="Your appointments above are unaffected."
            onRetry={refetch}
          />
        </div>
      ) : (
        <ul className="divide-y divide-rule">
          {rows.map((rx) => {
            const items = rx.items ?? []
            const printingThis = print.isPending && print.variables === rx.id
            return (
              <li key={rx.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                  <p className="text-portal font-medium text-ink">
                    {rx.diagnosis || 'Prescription'}
                  </p>
                  <p className="ident text-sm text-ink-3">
                    {on(rx.createdAt, 'd MMMM yyyy')}
                  </p>
                </div>

                {items.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {items.map((item, index) => (
                      <li key={index} className="text-sm text-ink-2">
                        <span className="font-medium text-ink">{item.medicineName}</span>
                        {item.dosage ? ` · ${item.dosage}` : ''}
                        {item.frequency ? ` · ${item.frequency}` : ''}
                        {item.duration ? ` · for ${item.duration}` : ''}
                      </li>
                    ))}
                  </ul>
                )}

                {rx.notes && <p className="mt-3 text-sm text-ink-2">{rx.notes}</p>}

                <button
                  type="button"
                  disabled={print.isPending}
                  onClick={() => print.mutate(rx.id)}
                  className="btn-secondary btn-sm mt-4"
                >
                  {printingThis ? (
                    <Spinner size={12} />
                  ) : (
                    <FileDown size={13} strokeWidth={2} aria-hidden="true" />
                  )}
                  {printingThis ? 'Preparing' : 'Download a copy'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

/** One test, with whatever the laboratory has written against it so far. */
function PortalTest({ request }) {
  const { data: results = [], isLoading } = useLabResults(request.id)
  const download = useDownloadLabResultFile()

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <p className="text-portal font-medium text-ink">{request.testName}</p>
        <p className="ident text-sm text-ink-3">{on(request.requestedAt, 'd MMMM yyyy')}</p>
      </div>

      <div className="mt-2">
        <StatusBadge
          status={request.status}
          label={PATIENT_TEST_WORDING[request.status]}
        />
      </div>

      {isLoading && <p className="mt-3 text-sm text-ink-3">Looking for your result…</p>}

      {!isLoading && results.length === 0 && request.status !== 'CANCELLED' && (
        <p className="mt-3 text-sm text-ink-2">
          The laboratory has not sent a result back yet. Your clinic will be in touch
          when it arrives.
        </p>
      )}

      {results.map((result) => (
        <div key={result.id} className="mt-3">
          <p className="text-sm leading-relaxed text-ink-2">{result.resultText}</p>
          {result.hasFile && (
            <button
              type="button"
              disabled={download.isPending}
              onClick={() => download.mutate(result)}
              className="btn-secondary btn-sm mt-3"
            >
              {download.isPending && download.variables?.id === result.id ? (
                <Spinner size={12} />
              ) : (
                <FileDown size={13} strokeWidth={2} aria-hidden="true" />
              )}
              {result.fileName}
            </button>
          )}
        </div>
      ))}
    </li>
  )
}

function PortalTests({ patientId }) {
  const { data: rows = [], isLoading, isError, refetch } = useLabRequestsByPatient(patientId)

  if (isLoading || (!isError && rows.length === 0)) return null

  const ordered = [...rows].sort(
    (a, b) => (Date.parse(b.requestedAt) || 0) - (Date.parse(a.requestedAt) || 0)
  )

  return (
    <Panel>
      <PanelHead title="Your test results" count={rows.length} />

      {isError ? (
        <div className="px-5 py-4">
          <ErrorBanner
            variant="degraded"
            title="Your test results are unavailable"
            message="Everything else on this page is current."
            onRetry={refetch}
          />
        </div>
      ) : (
        <ul className="divide-y divide-rule">
          {ordered.map((request) => (
            <PortalTest key={request.id} request={request} />
          ))}
        </ul>
      )}
    </Panel>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The page
   ───────────────────────────────────────────────────────────────────────── */

export default function MyHealth() {
  const { patientId } = useAuth()
  const [showPast, setShowPast] = useState(false)

  const profile = useQuery({
    queryKey: ['my-patient-record', patientId],
    queryFn: () => patientApi.getById(patientId),
    enabled: Boolean(patientId),
  })

  const appointments = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.getAll(),
  })

  const { next, upcoming, past } = useMemo(() => {
    const list = appointments.data ?? []
    const now = new Date()

    const ahead = list
      .filter((a) => a.appointmentDate && isAfter(parseISO(a.appointmentDate), now))
      .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))

    // A cancelled slot in the future is not something to look forward to, so it
    // never becomes the headline — but it stays in the list, because a patient
    // who was expecting it needs to see that it is off.
    const live = ahead.filter((a) => ['REQUESTED', 'CONFIRMED'].includes(a.status))

    return {
      next: live[0] ?? null,
      upcoming: ahead.filter((a) => a.id !== live[0]?.id),
      past: list
        .filter((a) => !a.appointmentDate || !isAfter(parseISO(a.appointmentDate), now))
        .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || '')),
    }
  }, [appointments.data])

  // An account with no linked record cannot show anything meaningful.
  if (!patientId) {
    return (
      <Panel>
        <EmptyState
          icon={UserRound}
          title="Your sign-in is not linked to a patient record"
          description="Ask the clinic to connect your account to your medical record, then reload this page."
        />
      </Panel>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Your care"
        title="Your health"
        description="Your appointments and the details the clinic holds for you. Only you can see this page."
      />

      {appointments.isError && (
        <ErrorBanner
          className="mb-6"
          title="Your appointments could not be loaded"
          message="Please try again in a moment, or call the clinic if this keeps happening."
          onRetry={appointments.refetch}
        />
      )}

      {appointments.isLoading && (
        <Panel className="mb-6 px-5 py-7" aria-busy="true">
          <SkeletonText chars={10} className="h-3" />
          <Skeleton className="mt-4 h-8 w-64" />
          <SkeletonText chars={24} className="mt-4" />
        </Panel>
      )}

      {!appointments.isLoading && next && <NextAppointment appointment={next} />}

      {!appointments.isLoading &&
        !appointments.isError &&
        !next &&
        (appointments.data ?? []).length > 0 && (
          <Panel className="mb-6">
            <EmptyState
              tone="good"
              title="Nothing booked at the moment."
              description="When the clinic books your next visit it will appear here."
            />
          </Panel>
        )}

      {!appointments.isLoading && (appointments.data ?? []).length === 0 && (
        <Panel className="mb-6">
          <EmptyState
            icon={CalendarDays}
            title="No appointments yet"
            description="When the clinic books a visit for you, it will appear here."
          />
        </Panel>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Panel>
              <PanelHead title="Also coming up" count={upcoming.length} />
              <ul className="divide-y divide-rule">
                {upcoming.map((appointment) => (
                  <Row key={appointment.id} appointment={appointment} />
                ))}
              </ul>
            </Panel>
          )}

          <PortalPrescriptions patientId={patientId} />

          <PortalTests patientId={patientId} />

          {/* Folded away by default. A patient's history is worth keeping and
              rarely worth reading; eighteen past visits above the fold is a
              filing cabinet, not an answer. */}
          {past.length > 0 && (
            <Panel>
              <button
                type="button"
                onClick={() => setShowPast((open) => !open)}
                aria-expanded={showPast}
                className="row-hover flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-portal font-medium text-ink">Past appointments</span>
                <span className="text-sm text-ink-3">
                  {showPast ? 'Hide' : `Show ${past.length}`}
                </span>
              </button>
              {showPast && (
                <ul className="divide-y divide-rule border-t border-rule">
                  {past.map((appointment) => (
                    <Row key={appointment.id} appointment={appointment} dim />
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>

        <Panel>
          <PanelHead title="Your details" />
          <div className="px-5 py-5">
            {profile.isLoading && (
              <div className="space-y-5" aria-busy="true">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="space-y-2">
                    <SkeletonText chars={8} className="h-2.5" />
                    <SkeletonText chars={18} />
                  </div>
                ))}
              </div>
            )}

            {profile.isError && (
              <ErrorBanner
                variant="degraded"
                title="Your details are unavailable"
                message="Your appointments above are unaffected."
                onRetry={profile.refetch}
              />
            )}

            {profile.data && (
              <dl className="space-y-5">
                <Field label="Full name">{profile.data.name}</Field>
                <Field label="Email">{profile.data.email}</Field>
                <Field label="Phone" mono>
                  {formatPhone(profile.data.phone)}
                </Field>
              </dl>
            )}

            <p className="mt-6 border-t border-rule pt-4 text-sm leading-relaxed text-ink-3">
              To correct any of these, ask the front desk on your next visit.
            </p>
          </div>
        </Panel>
      </div>
    </>
  )
}
