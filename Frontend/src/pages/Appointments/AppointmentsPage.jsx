/**
 * AppointmentsPage.jsx — Schedule and view appointments.
 *
 * Features:
 *  - Book new appointment (modal with patient + doctor pickers)
 *  - List all appointments with enriched patient/doctor info
 *  - Status badges (SCHEDULED / COMPLETED / CANCELLED)
 *  - Cancel appointment (confirm dialog)
 *  - Filter by status
 *  - Client-side search
 */
import { useState, useMemo } from 'react'
import { CalendarPlus, Search, Ban, CalendarDays, Clock } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Avatar from '../../components/ui/Avatar'
import { PageSpinner } from '../../components/ui/LoadingSpinner'
import AppointmentForm from './AppointmentForm'
import {
  useAppointments,
  useCreateAppointment,
  useCancelAppointment,
} from '../../hooks/useAppointments'
import { formatDate, getStatusBadge } from '../../utils'

const STATUS_FILTERS = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsPage() {
  const { data: appointments = [], isLoading, error, refetch } = useAppointments()

  const [createOpen, setCreateOpen] = useState(false)
  const [cancelAppointment, setCancelAppointment] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const createMutation = useCreateAppointment({ onSuccess: () => setCreateOpen(false) })
  const cancelMutation = useCancelAppointment({ onSuccess: () => setCancelAppointment(null) })

  // Filter: status + search
  const filtered = useMemo(() => {
    let list = appointments

    if (statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === statusFilter)
    }

    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (a) =>
          a.patient?.name?.toLowerCase().includes(q) ||
          a.doctor?.name?.toLowerCase().includes(q) ||
          a.doctor?.specialty?.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q)
      )
    }

    return list
  }, [appointments, statusFilter, search])

  const scheduledCount = appointments.filter((a) => a.status === 'SCHEDULED').length

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Appointments</h2>
          <p className="text-muted mt-1">
            {scheduledCount} upcoming · {appointments.length} total
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <CalendarPlus size={16} />
          Book Appointment
        </button>
      </div>

      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {/* Main card */}
      <div className="card overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3
                        px-6 py-4 border-b border-white/5">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search patient, doctor, specialty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-2 text-sm"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                  ${statusFilter === s
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25'
                    : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300 hover:bg-white/10'
                  }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {search && (
            <span className="text-xs text-slate-500 hidden sm:block">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && <PageSpinner />}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title={
              search || statusFilter !== 'ALL'
                ? 'No appointments match your filters'
                : 'No appointments yet'
            }
            description={
              search || statusFilter !== 'ALL'
                ? 'Try adjusting your search or status filter.'
                : 'Book the first appointment to get started.'
            }
            action={!(search || statusFilter !== 'ALL') && (
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <CalendarPlus size={15} /> Book First Appointment
              </button>
            )}
          />
        )}

        {/* Appointments list */}
        {!isLoading && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((appt, i) => {
              const badge = getStatusBadge(appt.status)
              const canCancel = appt.status === 'SCHEDULED'

              return (
                <div
                  key={appt.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5
                             hover:bg-white/[0.02] transition-colors duration-150
                             animate-slide-up"
                  style={{ animationDelay: `${i * 25}ms`, animationFillMode: 'both' }}
                >
                  {/* Patient + doctor info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">

                    {/* Avatars stacked */}
                    <div className="relative flex-shrink-0">
                      <Avatar name={appt.patient?.name || 'P'} size="md" />
                      <div className="absolute -bottom-1 -right-1">
                        <Avatar name={appt.doctor?.name || 'D'} size="sm" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      {/* Patient */}
                      <p className="text-sm font-semibold text-white truncate">
                        {appt.patient?.name || `Patient #${appt.patientId}`}
                      </p>
                      {/* Doctor + specialty */}
                      <p className="text-xs text-slate-400 truncate">
                        Dr. {appt.doctor?.name || `Doctor #${appt.doctorId}`}
                        {appt.doctor?.specialty
                          ? ` · ${appt.doctor.specialty}`
                          : ''}
                      </p>
                      {/* Notes preview */}
                      {appt.notes && (
                        <p className="text-xs text-slate-600 truncate mt-0.5 italic">
                          {`"${appt.notes}"`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date + status */}
                  <div className="flex items-center gap-4 flex-shrink-0 sm:flex-col sm:items-end">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Clock size={12} />
                      <span>{formatDate(appt.appointmentDate)}</span>
                    </div>

                    {/* Status badge */}
                    <span className={`badge ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Actions */}
                  {canCancel && (
                    <div className="flex-shrink-0">
                      <button
                        className="btn-danger text-xs"
                        onClick={() => setCancelAppointment(appt)}
                        title="Cancel appointment"
                      >
                        <Ban size={13} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Book New Appointment"
        size="md"
      >
        <AppointmentForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmDialog
        isOpen={!!cancelAppointment}
        onClose={() => setCancelAppointment(null)}
        onConfirm={() => cancelMutation.mutate(cancelAppointment?.id)}
        isLoading={cancelMutation.isPending}
        title="Cancel Appointment"
        message={`Cancel the appointment for "${cancelAppointment?.patient?.name || 'this patient'}"? This action cannot be undone.`}
        confirmLabel="Yes, Cancel It"
      />
    </div>
  )
}
