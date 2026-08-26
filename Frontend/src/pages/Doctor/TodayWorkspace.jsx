/**
 * TodayWorkspace.jsx — the doctor's day.
 *
 * A working screen rather than a report: the appointments for one day in time
 * order, and the actions a doctor actually takes during a clinic. The day is
 * scoped server-side from the token's doctorId claim, so this cannot be pointed
 * at a colleague's calendar.
 */
import React, { useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserX,
} from 'lucide-react'
import { addDays, format, isToday, parseISO } from 'date-fns'
import { useMyDay, useAppointmentTransition } from '../../hooks/useAppointments'
import { useAuth } from '../../auth/AuthProvider'
import { Skeleton } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import Avatar from '../../components/ui/Avatar'

const ISO_DAY = 'yyyy-MM-dd'

function DayNavigator({ day, onChange }) {
  const date = parseISO(day)

  const stepClass = `inline-flex h-8 w-8 items-center justify-center rounded-lg
     border border-white/10 text-slate-400 transition-colors duration-150
     hover:border-teal-500/40 hover:text-teal-400
     focus:outline-none focus:ring-2 focus:ring-teal-400
     focus:ring-offset-2 focus:ring-offset-navy-950`

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={stepClass}
        onClick={() => onChange(format(addDays(date, -1), ISO_DAY))}
        aria-label="Previous day"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="min-w-[13rem] text-center">
        <p className="font-display text-base font-bold text-white">
          {format(date, 'EEEE d MMMM')}
        </p>
        <p className="text-xs text-slate-500">
          {isToday(date) ? 'Today' : format(date, 'yyyy')}
        </p>
      </div>

      <button
        type="button"
        className={stepClass}
        onClick={() => onChange(format(addDays(date, 1), ISO_DAY))}
        aria-label="Next day"
      >
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      {!isToday(date) && (
        <button
          type="button"
          onClick={() => onChange(format(new Date(), ISO_DAY))}
          className="ml-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs
                     font-medium text-slate-300 transition-colors duration-150
                     hover:border-teal-500/40 hover:text-teal-400
                     focus:outline-none focus:ring-2 focus:ring-teal-400
                     focus:ring-offset-2 focus:ring-offset-navy-950"
        >
          Back to today
        </button>
      )}
    </div>
  )
}

function AppointmentAction({ label, icon: Icon, onClick, disabled, tone = 'neutral' }) {
  const tones = {
    primary:
      'border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:border-teal-500/50',
    neutral:
      'border-white/10 text-slate-300 hover:border-white/25 hover:text-slate-100',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5
                  text-xs font-medium transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-teal-400
                  focus:ring-offset-2 focus:ring-offset-navy-900
                  active:translate-y-px
                  disabled:cursor-not-allowed disabled:opacity-40
                  ${tones[tone]}`}
    >
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {label}
    </button>
  )
}

function AppointmentRow({ appointment, onTransition, isPending }) {
  const time = appointment.appointmentDate
    ? format(parseISO(appointment.appointmentDate), 'HH:mm')
    : '--:--'
  const allowed = appointment.allowedTransitions || []

  return (
    <li className="flex flex-col gap-4 px-6 py-5 transition-colors duration-150 hover:bg-white/[0.02] sm:flex-row sm:items-center">
      {/* Time is the spine of this screen, so it leads */}
      <div className="flex w-20 flex-shrink-0 items-baseline gap-1.5">
        <span className="font-display text-lg font-bold tabular-nums text-white">{time}</span>
        <span className="text-[10px] text-slate-600">{appointment.durationMinutes}m</span>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={appointment.patient?.name || 'Patient'} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {appointment.patient?.name || 'Unknown patient'}
          </p>
          {appointment.notes && (
            <p className="mt-0.5 max-w-[48ch] truncate text-xs text-slate-500">
              {appointment.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <StatusBadge status={appointment.status} />

        {allowed.includes('COMPLETED') && (
          <AppointmentAction
            label="Completed"
            icon={Check}
            tone="primary"
            disabled={isPending}
            onClick={() => onTransition({ id: appointment.id, action: 'complete' })}
          />
        )}
        {allowed.includes('NO_SHOW') && (
          <AppointmentAction
            label="No show"
            icon={UserX}
            disabled={isPending}
            onClick={() => onTransition({ id: appointment.id, action: 'no-show' })}
          />
        )}
      </div>
    </li>
  )
}

export default function TodayWorkspace() {
  const { fullName } = useAuth()
  const [day, setDay] = useState(() => format(new Date(), ISO_DAY))

  const { data, isLoading, isError, error } = useMyDay(day)
  const transition = useAppointmentTransition()

  const appointments = useMemo(() => data?.content ?? [], [data])

  const counts = useMemo(() => {
    const remaining = appointments.filter(
      (a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED'
    ).length
    return {
      total: appointments.length,
      remaining,
      seen: appointments.filter((a) => a.status === 'COMPLETED').length,
      missed: appointments.filter((a) => a.status === 'NO_SHOW').length,
    }
  }, [appointments])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            {fullName ? `Good day, ${fullName.split(' ').slice(-1)[0]}` : 'Your day'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Your appointments, in the order you will see them.
          </p>
        </div>
        <DayNavigator day={day} onChange={setDay} />
      </header>

      {/* A day at a glance, without card chrome around every number */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-4">
        {[
          { label: 'Booked', value: counts.total },
          { label: 'Still to see', value: counts.remaining },
          { label: 'Seen', value: counts.seen },
          { label: 'No shows', value: counts.missed },
        ].map((stat) => (
          <div key={stat.label} className="bg-navy-900 px-5 py-4">
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="card overflow-hidden">
        {isLoading && (
          <ul className="divide-y divide-white/5" aria-busy="true" aria-label="Loading your day">
            {[0, 1, 2].map((row) => (
              <li key={row} className="flex items-center gap-4 px-6 py-5">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </li>
            ))}
          </ul>
        )}

        {isError && (
          <div className="p-6">
            <ErrorBanner message={error?.message} />
          </div>
        )}

        {!isLoading && !isError && appointments.length === 0 && (
          <div className="py-10">
            <EmptyState
              icon={CalendarDays}
              title="Nothing booked for this day"
              description="Appointments the front desk books for you will appear here in time order."
            />
          </div>
        )}

        {!isLoading && appointments.length > 0 && (
          <ul className="divide-y divide-white/5">
            {appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onTransition={transition.mutate}
                isPending={transition.isPending}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
        <Clock size={12} strokeWidth={2} aria-hidden="true" />
        Times are shown in the clinic&apos;s local time zone
      </p>
    </div>
  )
}
