/**
 * LabsPage.jsx — laboratory work.
 *
 * Laboratory information has a shape, and the screen is built around it:
 *
 *     request  →  result  →  report
 *
 * A doctor asks for a test. The laboratory writes a finding against it. A
 * scanned or exported document may be attached to that finding. Each stage
 * exists without the next, and the reader has to be able to see which stage a
 * piece of work has reached — so the results hang off the request on the same
 * rule the day and the patient timeline use, and the attached report hangs off
 * the result.
 *
 * The upload constraints are printed next to the control, before anybody
 * chooses a file. Discovering that a 14 MB TIFF is not acceptable *after*
 * waiting for it to upload is a bad way to learn the rule.
 *
 * As on Billing and Prescriptions, this no longer demands a patient before it
 * will show anything.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ClipboardCheck,
  FileDown,
  FlaskConical,
  Paperclip,
  Plus,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import Segmented from '../../components/ui/Segmented'
import PageHeader from '../../components/ui/Page'
import { Panel } from '../../components/ui/Panel'
import { SkeletonRows, SkeletonText, Spinner } from '../../components/ui/LoadingSpinner'
import LabRequestForm from './LabRequestForm'
import LabResultForm from './LabResultForm'
import {
  useAllLabRequests,
  useCreateLabRequest,
  useCreateLabResult,
  useLabResults,
  useUploadLabResultFile,
  useDownloadLabResultFile,
} from '../../hooks/useLabs'
import { usePatientOptions } from '../../hooks/usePatients'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { formatDate } from '../../utils'

/** What the server will accept, said in the reader's words. */
const ACCEPTED = 'application/pdf,image/png,image/jpeg'
const ACCEPTED_LABEL = 'PDF, PNG or JPEG · up to 10 MB'

/** A file size a person reads, not a byte count. */
function fileSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ─────────────────────────────────────────────────────────────────────────
   A result, and whatever report is attached to it
   ───────────────────────────────────────────────────────────────────────── */

function Result({ result, requestId, canUpload }) {
  const upload = useUploadLabResultFile(requestId)
  const download = useDownloadLabResultFile()
  const inputId = `lab-result-file-${result.id}`

  const onPick = (event) => {
    const file = event.target.files?.[0]
    // Reset first, so choosing the same file twice still fires a change.
    event.target.value = ''
    if (file) upload.mutate({ resultId: result.id, file })
  }

  return (
    <li className="spine relative py-3">
      <span
        aria-hidden="true"
        className="absolute -left-[8px] top-[1.05rem] flex h-4 w-4 items-center justify-center
 bg-surface text-ink-3"
      >
        <ClipboardCheck size={12} strokeWidth={1.75} />
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <p className="section-label">Result {String(result.id).padStart(4, '0')}</p>
        <p className="ident text-meta text-ink-3">
          {formatDate(result.resultedAt, 'd MMM yyyy')}
        </p>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-ink">{result.resultText}</p>
      {result.observations && (
        <p className="mt-1 text-sm text-ink-3">{result.observations}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {result.hasFile ? (
          <button
            type="button"
            disabled={download.isPending}
            onClick={() => download.mutate(result)}
            className="btn-row"
          >
            {download.isPending && download.variables?.id === result.id ? (
              <Spinner size={12} />
            ) : (
              <FileDown size={12} strokeWidth={2} aria-hidden="true" />
            )}
            {result.fileName}
            <span className="ident text-ink-3">{fileSize(result.fileSize)}</span>
          </button>
        ) : (
          !canUpload && (
            <span className="text-meta text-ink-3">No report attached.</span>
          )
        )}

        {/* Offered only to the roles the gateway will accept an upload from. A
            receptionist can read a result all day and will never be allowed to
            file one; a button that can only produce a 403 is worse than none. */}
        {canUpload && (
          <>
            <input
              id={inputId}
              type="file"
              className="sr-only"
              accept={ACCEPTED}
              onChange={onPick}
              disabled={upload.isPending}
            />
            <label
              htmlFor={inputId}
              className={`btn btn-sm cursor-pointer border-dashed border-rule text-ink-2
                          hover:border-primary hover:text-primary
                          focus-within:border-primary
                          ${upload.isPending ? 'pointer-events-none opacity-50' : ''}`}
            >
              {upload.isPending ? (
                <Spinner size={12} />
              ) : (
                <Paperclip size={12} strokeWidth={2} aria-hidden="true" />
              )}
              {upload.isPending
                ? 'Uploading'
                : result.hasFile
                  ? 'Replace report'
                  : 'Attach report'}
            </label>

            {/* Said before a file is chosen, not after one is refused. */}
            <span className="text-meta text-ink-3">{ACCEPTED_LABEL}</span>
          </>
        )}
      </div>
    </li>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Results under one request
   ───────────────────────────────────────────────────────────────────────── */

function Results({ requestId, canUpload, canRecord, onRecord }) {
  const { data: results = [], isLoading, isError, refetch } = useLabResults(requestId)

  return (
    <div className="border-t border-rule bg-raised px-5 py-4">
      {isLoading && (
        <div className="space-y-2" aria-busy="true">
          <SkeletonText chars={30} />
          <SkeletonText chars={20} className="opacity-60" />
        </div>
      )}

      {isError && (
        <ErrorBanner
          variant="degraded"
          title="Results unavailable"
          message="The finding for this request could not be read. The request itself is unaffected."
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && results.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-3">
            The laboratory has not returned a finding for this request yet.
          </p>
          {canRecord && (
            <button type="button" className="btn-row" onClick={onRecord}>
              <Plus size={12} strokeWidth={2} aria-hidden="true" />
              Record the result
            </button>
          )}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <ol>
            {results.map((result) => (
              <Result
                key={result.id}
                result={result}
                requestId={requestId}
                canUpload={canUpload}
              />
            ))}
          </ol>
          {canRecord && (
            <button type="button" className="btn-row mt-3" onClick={onRecord}>
              <Plus size={12} strokeWidth={2} aria-hidden="true" />
              Add another result
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The page
   ───────────────────────────────────────────────────────────────────────── */

export default function LabsPage() {
  const { hasAnyRole } = useAuth()
  const requests = useAllLabRequests()
  const patients = usePatientOptions()

  const canUpload = hasAnyRole([ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECHNICIAN])
  const canRecord = hasAnyRole([ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECHNICIAN])

  const [scope, setScope] = useState('open')
  const [patientFilter, setPatientFilter] = useState('')
  const [openId, setOpenId] = useState(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [resultFor, setResultFor] = useState(null)

  const createRequest = useCreateLabRequest({ onSuccess: () => setRequestOpen(false) })
  const createResult = useCreateLabResult({ onSuccess: () => setResultFor(null) })

  const patientNames = useMemo(() => {
    const map = new Map()
    for (const patient of patients.data ?? []) map.set(patient.id, patient.name)
    return map
  }, [patients.data])

  const all = useMemo(() => requests.data ?? [], [requests.data])

  const scopes = useMemo(() => {
    const test = {
      open: (row) => ['PENDING', 'IN_PROGRESS'].includes(row.status),
      completed: (row) => row.status === 'COMPLETED',
      cancelled: (row) => row.status === 'CANCELLED',
      all: () => true,
    }
    return {
      test,
      counts: Object.fromEntries(
        Object.entries(test).map(([key, fn]) => [key, all.filter(fn).length])
      ),
    }
  }, [all])

  /**
   * "Open" is the right thing to be asked about first, but landing on an empty
   * tab while five completed tests sit one click away is worse than being
   * shown the whole list. If there is nothing open the first time the data
   * arrives, fall through to everything — once, so that a reader who then
   * chooses "Open" deliberately is left there.
   */
  const settled = useRef(false)
  useEffect(() => {
    if (settled.current || requests.isLoading || all.length === 0) return
    settled.current = true
    if (scopes.counts.open === 0) setScope('all')
  }, [requests.isLoading, all.length, scopes.counts.open])

  const rows = useMemo(() => {
    let list = all.filter(scopes.test[scope])
    if (patientFilter) {
      list = list.filter((row) => String(row.patientId) === String(patientFilter))
    }
    return list.sort(
      (a, b) => (Date.parse(b.requestedAt) || 0) - (Date.parse(a.requestedAt) || 0)
    )
  }, [all, scope, patientFilter, scopes])

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Laboratory"
        description="Tests the clinic has ordered, the findings returned against them, and the reports attached to those findings."
        actions={
          <button type="button" className="btn-primary" onClick={() => setRequestOpen(true)}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            Order a test
          </button>
        }
      />

      {requests.isError && (
        <ErrorBanner
          className="mb-6"
          title="Laboratory work could not be loaded"
          message={requests.error?.message}
          onRetry={requests.refetch}
        />
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-3">
          <Segmented
            label="Which laboratory work to show"
            value={scope}
            onChange={(value) => {
              setScope(value)
              setOpenId(null)
            }}
            options={[
              { value: 'open', label: 'Open', count: scopes.counts.open },
              { value: 'completed', label: 'Completed', count: scopes.counts.completed },
              { value: 'cancelled', label: 'Cancelled', count: scopes.counts.cancelled },
              { value: 'all', label: 'All', count: scopes.counts.all },
            ]}
          />

          <div className="mb-2 w-full max-w-[15rem] sm:mb-0">
            <label className="sr-only" htmlFor="lab-patient-filter">
              Filter by patient
            </label>
            <select
              id="lab-patient-filter"
              className="select h-8 py-0 text-meta"
              value={patientFilter}
              onChange={(event) => {
                setPatientFilter(event.target.value)
                setOpenId(null)
              }}
            >
              <option value="">Every patient</option>
              {(patients.data ?? []).map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {requests.isLoading && <SkeletonRows rows={4} label="Loading laboratory work" />}

        {!requests.isLoading && rows.length === 0 && (
          <EmptyState
            icon={FlaskConical}
            title={
              patientFilter
                ? 'No laboratory work for this patient'
                : scope === 'open'
                  ? 'Nothing is waiting on the laboratory'
                  : 'Nothing here'
            }
            description={
              scope === 'open'
                ? 'Every test the clinic has ordered has come back or been cancelled.'
                : 'Tests a doctor orders appear here, with their findings underneath.'
            }
            action={
              !patientFilter && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRequestOpen(true)}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Order a test
                </button>
              )
            }
          />
        )}

        {!requests.isLoading && rows.length > 0 && (
          <ul className="divide-y divide-rule">
            {rows.map((request) => {
              const isOpen = openId === request.id
              const panelId = `lab-request-${request.id}`
              return (
                <li key={request.id}>
                  <div className="row-hover flex flex-wrap items-start gap-x-5 gap-y-2 px-5 py-3">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenId(isOpen ? null : request.id)}
                      className="flex min-w-0 flex-1 items-start gap-4 rounded text-left"
                    >
                      <ChevronDown
                        size={14}
                        strokeWidth={2}
                        aria-hidden="true"
                        className={`mt-1 flex-shrink-0 text-ink-3 transition-transform
                                    duration-fast ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="text-sm font-medium text-ink">
                            {request.testName}
                          </span>
                          <StatusBadge status={request.status} size="sm" />
                        </span>
                        <span className="mt-1 block truncate text-meta text-ink-3">
                          {patientNames.get(request.patientId) || `Patient ${request.patientId}`}
                          {` · ordered ${formatDate(request.requestedAt, 'd MMM yyyy')}`}
                        </span>
                        {request.testDescription && (
                          <span className="mt-1 block max-w-[70ch] text-sm text-ink-3">
                            {request.testDescription}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* "Record" alone would sit next to "Record the result"
                        one level down and mean something else entirely. */}
                    <Link
                      to={`/patients/${request.patientId}`}
                      className="btn-row flex-shrink-0"
                    >
                      Open patient
                    </Link>
                  </div>

                  {isOpen && (
                    <div id={panelId}>
                      <Results
                        requestId={request.id}
                        canUpload={canUpload}
                        canRecord={canRecord}
                        onRecord={() => setResultFor(request)}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Modal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Order a laboratory test"
      >
        <LabRequestForm
          onSubmit={(data) => createRequest.mutate(data)}
          isLoading={createRequest.isPending}
        />
      </Modal>

      <Modal
        isOpen={Boolean(resultFor)}
        onClose={() => setResultFor(null)}
        title="Record a result"
        description={resultFor ? resultFor.testName : undefined}
      >
        <LabResultForm
          requestId={resultFor?.id}
          requestName={resultFor?.testName}
          onSubmit={(data) => createResult.mutate(data)}
          isLoading={createResult.isPending}
        />
      </Modal>
    </>
  )
}
