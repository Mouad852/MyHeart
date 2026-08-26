/**
 * MyHealth.jsx — the patient's own view of their care.
 *
 * Everything here is scoped server-side: patient-service returns only the
 * record matching the patientId claim, and appointment-service narrows the
 * appointment query to the same id. Nothing is filtered in the browser.
 */
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Mail, Phone, UserRound } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { useAuth } from '../../auth/AuthProvider'
import patientApi from '../../services/patientApi'
import appointmentApi from '../../services/appointmentApi'
import { Skeleton } from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'

function safeFormat(value, pattern) {
  if (!value) return null
  try {
    return format(parseISO(value), pattern)
  } catch {
    return value
  }
}

function ProfileCard({ patient }) {
  const rows = [
    { icon: UserRound, label: 'Full name', value: patient?.name },
    { icon: Mail, label: 'Email', value: patient?.email },
    { icon: Phone, label: 'Phone', value: patient?.phone },
  ].filter((row) => row.value)

  return (
    <section className="card p-6">
      <h2 className="font-display text-base font-bold text-white">Your details</h2>
      <dl className="mt-5 space-y-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={16} className="mt-0.5 flex-shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-0.5 break-words text-sm text-slate-200">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-6 border-t border-white/5 pt-4 text-xs leading-relaxed text-slate-500">
        To correct any of these details, ask the front desk on your next visit.
      </p>
    </section>
  )
}

function AppointmentRow({ appointment }) {
  const when = safeFormat(appointment.appointmentDate, 'EEEE d MMMM yyyy')
  const time = safeFormat(appointment.appointmentDate, 'HH:mm')

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">
          {when} at {time}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {appointment.doctor?.name || 'Doctor to be confirmed'}
          {appointment.doctor?.specialty ? `, ${appointment.doctor.specialty}` : ''}
        </p>
        {appointment.notes && (
          <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-slate-400">
            {appointment.notes}
          </p>
        )}
      </div>
      <StatusBadge status={appointment.status} />
    </li>
  )
}

export default function MyHealth() {
  const { patientId, fullName } = useAuth()

  const profile = useQuery({
    queryKey: ['my-patient-record', patientId],
    queryFn: () => patientApi.getById(patientId),
    enabled: Boolean(patientId),
  })

  const appointments = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.getAll(),
  })

  // A patient account with no linked record cannot show anything meaningful.
  if (!patientId) {
    return (
      <EmptyState
        icon={UserRound}
        title="Your account is not linked to a patient record"
        description="Ask the clinic to connect your sign-in to your medical record, then reload this page."
      />
    )
  }

  const upcoming = (appointments.data || [])
    .filter((a) => a.appointmentDate && isAfter(parseISO(a.appointmentDate), new Date()))
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))

  const past = (appointments.data || [])
    .filter((a) => !a.appointmentDate || !isAfter(parseISO(a.appointmentDate), new Date()))
    .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''))

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          {fullName ? `Hello, ${fullName.split(' ')[0]}` : 'Your health'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Your appointments and personal details, visible only to you.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Appointments */}
        <section className="card p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-base font-bold text-white">Appointments</h2>
            {appointments.data && (
              <span className="text-xs text-slate-500">
                {appointments.data.length} in total
              </span>
            )}
          </div>

          {appointments.isLoading && (
            <div className="mt-6 space-y-4" aria-busy="true" aria-label="Loading appointments">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          )}

          {appointments.isError && (
            <div className="mt-5">
              <ErrorBanner message={appointments.error?.message} />
            </div>
          )}

          {appointments.data && appointments.data.length === 0 && (
            <div className="py-6">
              <EmptyState
                icon={CalendarDays}
                title="No appointments yet"
                description="When the clinic books a visit for you, it will appear here."
              />
            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Upcoming
              </h3>
              <ul className="divide-y divide-white/5">
                {upcoming.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </ul>
            </>
          )}

          {past.length > 0 && (
            <>
              <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Earlier
              </h3>
              <ul className="divide-y divide-white/5 opacity-70">
                {past.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Profile */}
        <div className="space-y-6">
          {profile.isLoading && (
            <div className="card space-y-4 p-6" aria-busy="true" aria-label="Loading your details">
              <Skeleton className="h-4 w-28" />
              {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-44" />
                </div>
              ))}
            </div>
          )}
          {profile.isError && <ErrorBanner message={profile.error?.message} />}
          {profile.data && <ProfileCard patient={profile.data} />}
        </div>
      </div>
    </div>
  )
}
