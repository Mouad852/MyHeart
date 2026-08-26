/**
 * PrescriptionsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Prescription management page.
 *
 * Features:
 *  - Filter by patient or doctor
 *  - Create prescription (modal with dynamic medicine list)
 *  - View medicine details in an expandable row
 *  - Loading / empty / error states
 * ─────────────────────────────────────────────────────────────────
 */
import { useState } from 'react'
import {
  Pill, Plus, ChevronDown, ChevronUp, User, Stethoscope, FileDown,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { PageSpinner } from '../../components/ui/LoadingSpinner'
import PatientSelector from '../../components/ui/PatientSelector'
import PrescriptionForm from './PrescriptionForm'
import {
  usePrescriptionsByPatient,
  useCreatePrescription,
  usePrescriptionDocument,
} from '../../hooks/usePrescriptions'
import { formatDate } from '../../utils'

export default function PrescriptionsPage() {
  const [patientId, setPatientId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const {
    data: prescriptions = [],
    isLoading,
    error,
    refetch,
  } = usePrescriptionsByPatient(patientId)

  const createMutation = useCreatePrescription({ onSuccess: () => setCreateOpen(false) })
  const document_ = usePrescriptionDocument()

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Prescriptions</h2>
          <p className="text-muted mt-1">Create and review patient prescriptions</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New Prescription
        </button>
      </div>

      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {/* ── Patient filter ──────────────────────────────── */}
      <div className="card p-5">
        <div className="max-w-sm">
          <PatientSelector
            value={patientId}
            onChange={setPatientId}
            label="Filter by Patient"
            placeholder="Choose a patient to view prescriptions…"
          />
        </div>
      </div>

      {/* ── Prescriptions list ──────────────────────────── */}
      <div className="card overflow-hidden">

        {!patientId && (
          <EmptyState
            icon={Pill}
            title="Select a patient"
            description="Choose a patient above to view their prescriptions."
          />
        )}

        {patientId && isLoading && <PageSpinner />}

        {patientId && !isLoading && prescriptions.length === 0 && !error && (
          <EmptyState
            icon={Pill}
            title="No prescriptions found"
            description="This patient has no prescriptions yet."
            action={
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus size={15} /> Create Prescription
              </button>
            }
          />
        )}

        {patientId && !isLoading && prescriptions.length > 0 && (
          <div className="divide-y divide-white/5">
            {prescriptions.map((rx, i) => {
              const isExpanded = expandedId === rx.id
              return (
                <div key={rx.id} className="animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>

                  {/* ── Prescription row ── */}
                  <div
                    className="flex items-center gap-4 px-6 py-4
                               hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
                    onClick={() => toggleExpand(rx.id)}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20
                                    flex items-center justify-center flex-shrink-0">
                      <Pill size={16} className="text-violet-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-semibold text-white">
                          Rx #{rx.id}
                        </p>
                        {rx.diagnosis && (
                          <span className="text-xs text-slate-500 italic">
                            {rx.diagnosis}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User size={11} />
                          Patient #{rx.patientId}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Stethoscope size={11} />
                          Dr. #{rx.doctorId}
                        </span>
                        <span className="text-xs text-slate-600">
                          {formatDate(rx.createdAt, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Medicine count + print + expand */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="badge bg-violet-500/10 text-violet-400">
                        {rx.items?.length ?? 0} medicine{rx.items?.length !== 1 ? 's' : ''}
                      </span>

                      {/* stopPropagation: the whole row toggles the medicine
                          table, and printing should not also expand it. */}
                      <button
                        type="button"
                        title="Download the printable prescription"
                        disabled={document_.isPending}
                        onClick={(event) => {
                          event.stopPropagation()
                          document_.mutate(rx.id)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10
                                   px-2.5 py-1.5 text-xs font-medium text-slate-300
                                   transition-all duration-150
                                   hover:border-teal-500/40 hover:text-teal-400
                                   focus:outline-none focus:ring-2 focus:ring-teal-400
                                   focus:ring-offset-2 focus:ring-offset-navy-900
                                   active:translate-y-px
                                   disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FileDown size={13} strokeWidth={2} aria-hidden="true" />
                        {document_.isPending && document_.variables === rx.id
                          ? 'Preparing'
                          : 'Print'}
                      </button>
                      {isExpanded
                        ? <ChevronUp size={15} className="text-slate-500" />
                        : <ChevronDown size={15} className="text-slate-500" />
                      }
                    </div>
                  </div>

                  {/* ── Expanded medicines ── */}
                  {isExpanded && rx.items?.length > 0 && (
                    <div className="px-6 pb-5">
                      <div className="ml-13 bg-navy-900/50 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/5">
                              {['Medicine', 'Dosage', 'Frequency', 'Duration'].map((h) => (
                                <th
                                  key={h}
                                  className="text-left px-4 py-2.5 text-[10px] font-bold
                                             text-slate-600 uppercase tracking-widest"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rx.items.map((m, mi) => (
                              <tr key={mi} className="border-b border-white/5 last:border-0">
                                <td className="px-4 py-2.5 font-medium text-white">{m.medicineName}</td>
                                <td className="px-4 py-2.5 text-slate-400">{m.dosage}</td>
                                <td className="px-4 py-2.5 text-slate-400">{m.frequency}</td>
                                <td className="px-4 py-2.5 text-slate-400">{m.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create Modal ──────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Prescription"
        size="lg"
      >
        <PrescriptionForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}
