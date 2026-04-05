/**
 * LabsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Lab management page.
 *
 * Features:
 *  - Filter lab requests by patient
 *  - Create lab request (modal)
 *  - Expand request row to view results
 *  - Add result to a PENDING request (modal)
 *  - Status progression: PENDING → COMPLETED (after result added)
 * ─────────────────────────────────────────────────────────────────
 */
import { useState } from 'react'
import {
  FlaskConical, Plus, ChevronDown, ChevronUp,
  FileText, User, Stethoscope, ClipboardCheck,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import { PageSpinner } from '../../components/ui/LoadingSpinner'
import PatientSelector from '../../components/ui/PatientSelector'
import LabRequestForm from './LabRequestForm'
import LabResultForm from './LabResultForm'
import {
  useLabRequestsByPatient,
  useLabResults,
  useCreateLabRequest,
  useCreateLabResult,
} from '../../hooks/useLabs'
import { formatDate } from '../../utils'

export default function LabsPage() {
  const [patientId,       setPatientId]       = useState('')
  const [requestOpen,     setRequestOpen]     = useState(false)
  const [resultTarget,    setResultTarget]    = useState(null) // {id, testName}
  const [expandedId,      setExpandedId]      = useState(null)

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useLabRequestsByPatient(patientId)

  const createRequestMutation = useCreateLabRequest({ onSuccess: () => setRequestOpen(false) })
  const createResultMutation  = useCreateLabResult({  onSuccess: () => setResultTarget(null) })

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ───────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Labs</h2>
          <p className="text-muted mt-1">Manage lab requests and test results</p>
        </div>
        <button className="btn-primary" onClick={() => setRequestOpen(true)}>
          <Plus size={16} />
          New Lab Request
        </button>
      </div>

      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {/* ── Patient filter ────────────────────────────── */}
      <div className="card p-5">
        <div className="max-w-sm">
          <PatientSelector
            value={patientId}
            onChange={setPatientId}
            label="Filter by Patient"
            placeholder="Choose a patient to view lab requests…"
          />
        </div>
      </div>

      {/* ── Lab requests list ─────────────────────────── */}
      <div className="card overflow-hidden">

        {!patientId && (
          <EmptyState
            icon={FlaskConical}
            title="Select a patient"
            description="Choose a patient above to view their lab requests and results."
          />
        )}

        {patientId && isLoading && <PageSpinner />}

        {patientId && !isLoading && requests.length === 0 && !error && (
          <EmptyState
            icon={FlaskConical}
            title="No lab requests found"
            description="No lab requests have been created for this patient."
            action={
              <button className="btn-primary" onClick={() => setRequestOpen(true)}>
                <Plus size={15} /> Create Lab Request
              </button>
            }
          />
        )}

        {patientId && !isLoading && requests.length > 0 && (
          <div className="divide-y divide-white/5">
            {requests.map((req, i) => {
              const isExpanded = expandedId === req.id
              const isPending  = req.status === 'PENDING'

              return (
                <div key={req.id} className="animate-slide-up"
                     style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>

                  {/* ── Request row ── */}
                  <div
                    className="flex items-center gap-4 px-6 py-4
                               hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
                    onClick={() => toggleExpand(req.id)}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isPending
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-teal-500/10 border border-teal-500/20'}`}
                    >
                      <FlaskConical
                        size={16}
                        className={isPending ? 'text-amber-400' : 'text-teal-400'}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {req.testName}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User size={11} /> Patient #{req.patientId}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Stethoscope size={11} /> Dr. #{req.doctorId}
                        </span>
                        <span className="text-xs text-slate-600">
                          {formatDate(req.createdAt, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Status + expand */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={req.status || 'PENDING'} />

                      {/* Add result button (only for PENDING) */}
                      {isPending && (
                        <button
                          className="btn-secondary text-xs py-1.5 px-3"
                          title="Add result"
                          onClick={(e) => {
                            e.stopPropagation()
                            setResultTarget({ id: req.id, testName: req.testName })
                          }}
                        >
                          <ClipboardCheck size={13} />
                          Add Result
                        </button>
                      )}

                      {isExpanded
                        ? <ChevronUp size={15} className="text-slate-500" />
                        : <ChevronDown size={15} className="text-slate-500" />
                      }
                    </div>
                  </div>

                  {/* ── Expanded results panel ── */}
                  {isExpanded && (
                    <LabResultsPanel requestId={req.id} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create Lab Request Modal ─────────────────── */}
      <Modal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="New Lab Request"
      >
        <LabRequestForm
          onSubmit={(data) => createRequestMutation.mutate(data)}
          isLoading={createRequestMutation.isPending}
        />
      </Modal>

      {/* ── Add Result Modal ──────────────────────────── */}
      <Modal
        isOpen={!!resultTarget}
        onClose={() => setResultTarget(null)}
        title="Submit Lab Result"
      >
        <LabResultForm
          requestId={resultTarget?.id}
          requestName={resultTarget?.testName}
          onSubmit={(data) => createResultMutation.mutate(data)}
          isLoading={createResultMutation.isPending}
        />
      </Modal>
    </div>
  )
}

/** Inline component that fetches and renders results for a single request */
function LabResultsPanel({ requestId }) {
  const { data: results = [], isLoading } = useLabResults(requestId)

  return (
    <div className="px-6 pb-5">
      <div className="ml-13 bg-navy-900/50 rounded-2xl border border-white/5 overflow-hidden">
        {isLoading && (
          <div className="p-4 flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-t-teal-400 rounded-full animate-spin" />
            Loading results…
          </div>
        )}

        {!isLoading && results.length === 0 && (
          <div className="p-4 flex items-center gap-2 text-sm text-slate-500">
            <FileText size={14} className="text-slate-600" />
            No results submitted yet.
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="divide-y divide-white/5">
            {results.map((res) => (
              <div key={res.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Result #{res.id}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {formatDate(res.createdAt, 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed ml-5">{res.result}</p>
                {res.notes && (
                  <p className="text-xs text-slate-500 italic ml-5 mt-1">{res.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
