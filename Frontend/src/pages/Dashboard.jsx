/**
 * Dashboard.jsx — Overview page showing system-wide stats
 * and the most recent appointments.
 */
import { Link } from 'react-router-dom'
import {
  Users, Stethoscope, CalendarDays, Clock,
  ArrowRight, TrendingUp, ReceiptText, Pill, FlaskConical,
} from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import { PageSpinner } from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import Avatar from '../components/ui/Avatar'
import { usePatients } from '../hooks/usePatients'
import { useDoctors } from '../hooks/useDoctors'
import { useAppointments } from '../hooks/useAppointments'
import { useAllInvoices } from '../hooks/useBilling'
import { useAllPrescriptions } from '../hooks/usePrescriptions'
import { useAllLabRequests } from '../hooks/useLabs'
import { formatDate, getStatusBadge } from '../utils'

export default function Dashboard() {
  const patients = usePatients()
  const doctors = useDoctors()
  const appointments = useAppointments()
  const invoices = useAllInvoices()
  const prescriptions = useAllPrescriptions()
  const labRequests = useAllLabRequests()

  const error = patients.error || doctors.error || appointments.error

  // Most recent 5 appointments
  const recentAppointments = (appointments.data || []).slice(0, 5)

  // Quick stats
  const scheduledCount = (appointments.data || []).filter(
    (a) => a.status === 'SCHEDULED'
  ).length

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Welcome banner */}
      <div className="relative overflow-hidden card p-7 border-teal-500/10">
        <div className="absolute right-0 top-0 w-72 h-full opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at right, rgba(45,212,191,0.8) 0%, transparent 70%)'
          }}
        />
        <div className="relative z-10">
          <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1">
            Good morning
          </p>
          <h2 className="font-display text-3xl font-bold text-white mb-1">
            Medical Management
          </h2>
          <p className="text-slate-400 text-sm">
            {`Here's a real-time overview of your system status.`}
          </p>
        </div>
      </div>

      {/* Stats grid — Row 1: Core entities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Patients"
          value={patients.data?.length}
          color="teal"
          isLoading={patients.isLoading}
        />
        <StatsCard
          icon={Stethoscope}
          label="Total Doctors"
          value={doctors.data?.length}
          color="blue"
          isLoading={doctors.isLoading}
        />
        <StatsCard
          icon={CalendarDays}
          label="Appointments"
          value={appointments.data?.length}
          color="violet"
          isLoading={appointments.isLoading}
        />
        <StatsCard
          icon={Clock}
          label="Scheduled"
          value={scheduledCount}
          color="amber"
          isLoading={appointments.isLoading}
        />
      </div>

      {/* Stats grid — Row 2: Extended services */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={ReceiptText}
          label="Total Invoices"
          value={invoices.data?.length}
          color="amber"
          isLoading={invoices.isLoading}
        />
        <StatsCard
          icon={Pill}
          label="Prescriptions"
          value={prescriptions.data?.length}
          color="violet"
          isLoading={prescriptions.isLoading}
        />
        <StatsCard
          icon={FlaskConical}
          label="Lab Requests"
          value={labRequests.data?.length}
          color="blue"
          isLoading={labRequests.isLoading}
        />
      </div>

      {error && (
        <ErrorBanner message={error.message} onRetry={() => {
          patients.refetch(); doctors.refetch(); appointments.refetch()
        }} />
      )}

      {/* Recent appointments + quick links */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent appointments table */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-400" />
              <h3 className="font-display font-semibold text-white">Recent Appointments</h3>
            </div>
            <Link to="/appointments" className="text-xs text-teal-400 hover:text-teal-300
                                                 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {appointments.isLoading ? (
            <div className="p-6"><PageSpinner /></div>
          ) : recentAppointments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-500">No appointments yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentAppointments.map((appt) => {
                const badge = getStatusBadge(appt.status)
                return (
                  <div key={appt.id} className="flex items-center gap-4 px-6 py-4
                                                 hover:bg-white/[0.02] transition-colors">
                    <Avatar name={appt.patient?.name || 'P'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {appt.patient?.name || `Patient #${appt.patientId}`}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        Dr. {appt.doctor?.name || `Doctor #${appt.doctorId}`}
                        {appt.doctor?.specialty ? ` · ${appt.doctor.specialty}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge ${badge.className} mb-1`}>{badge.label}</span>
                      <p className="text-xs text-slate-600">
                        {formatDate(appt.appointmentDate, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="font-display font-semibold text-white mb-2">Quick Actions</h3>

          {[
            { to: '/patients', icon: Users, label: 'Manage Patients', sub: 'Add, edit, remove patients', color: 'text-teal-400' },
            { to: '/doctors', icon: Stethoscope, label: 'Manage Doctors', sub: 'Update doctor info', color: 'text-blue-400' },
            { to: '/appointments', icon: CalendarDays, label: 'Book Appointment', sub: 'Schedule a new appointment', color: 'text-violet-400' },
            { to: '/billing', icon: ReceiptText, label: 'Billing', sub: 'Create & pay invoices', color: 'text-amber-400' },
            { to: '/prescriptions', icon: Pill, label: 'Prescriptions', sub: 'Issue patient prescriptions', color: 'text-violet-400' },
            { to: '/labs', icon: FlaskConical, label: 'Lab Requests', sub: 'Request & submit lab results', color: 'text-blue-400' },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/3
                         border border-white/5 hover:border-white/15
                         hover:bg-white/5 transition-all duration-200 group"
            >
              <Icon size={18} className={`${color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400
                                               group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
