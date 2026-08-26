/**
 * PrescriptionsPage.jsx — what has been prescribed.
 *
 * Like Billing, this screen used to refuse to show anything until a patient had
 * been chosen from a dropdown, which meant a doctor could not answer "what did
 * I write this week" without already knowing the answer. It opens on everything,
 * most recent first, and the patient filter is one control among several.
 *
 * Printing is treated as the workflow it is, not as an icon in a corner. The
 * service renders a real A4 document — letterhead, prescriber, medication table,
 * signature line — and it is the artefact that leaves the building with the
 * patient, so the control that produces it is labelled in words on every row and
 * stated again, larger, at the foot of an opened prescription.
 *
 * A prescription is a record of what a named person prescribed to another named
 * person, so this shows names. It previously read "Patient #4 · Dr. #3", which
 * is what the database stores and not what anybody needs.
 */
import { useMemo, useState } from 'react'
import { ChevronDown, FileDown, Pill, Plus } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import PageHeader from '../../components/ui/Page'
import { Panel } from '../../components/ui/Panel'
import { SkeletonRows, Spinner } from '../../components/ui/LoadingSpinner'
import PrescriptionForm from './PrescriptionForm'
import {
  useAllPrescriptions,
  useCreatePrescription,
  usePrescriptionDocument,
} from '../../hooks/usePrescriptions'
import { usePatientOptions } from '../../hooks/usePatients'
import { useDoctorOptions } from '../../hooks/useDoctors'
import { formatDate } from '../../utils'

/** The medication table, shown when a prescription is opened. */
function Medications({ items = [] }) {
  if (items.length === 0) {
    return (
      <p className="px-5 pb-5 text-sm text-ink-3">
        No medication was recorded against this prescription.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto px-5 pb-5">
      <table className="w-full border border-rule">
        <thead>
          <tr className="bg-raised">
            <th className="th">Medicine</th>
            <th className="th">Dosage</th>
            <th className="th">Frequency</th>
            <th className="th">For</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="td font-medium text-ink">{item.medicineName}</td>
              <td className="td ident text-ink-2">{item.dosage || '—'}</td>
              <td className="td text-ink-2">{item.frequency || '—'}</td>
              <td className="td text-ink-2">{item.duration || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ prescription, patientName, doctorName, isOpen, onToggle, print }) {
  const items = prescription.items ?? []
  const printingThis = print.isPending && print.variables === prescription.id
  const panelId = `rx-${prescription.id}-medication`

  return (
    <li>
      <div className="row-hover flex flex-wrap items-start gap-x-5 gap-y-3 px-5 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-start gap-4 rounded text-left"
        >
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className={`mt-1 flex-shrink-0 text-ink-3 transition-transform duration-fast
                        ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          />

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="ident text-sm font-medium text-ink">
                RX-{String(prescription.id).padStart(5, '0')}
              </span>
              {prescription.diagnosis && (
                <span className="min-w-0 truncate text-sm text-ink-2">
                  {prescription.diagnosis}
                </span>
              )}
            </span>

            <span className="mt-1 block truncate text-meta text-ink-3">
              {patientName}
              {' · '}
              {doctorName}
              {` · ${formatDate(prescription.createdAt, 'd MMM yyyy')} · `}
              {items.length} {items.length === 1 ? 'medicine' : 'medicines'}
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={print.isPending}
          onClick={() => print.mutate(prescription.id)}
          className="btn-row flex-shrink-0"
        >
          {printingThis ? (
            <Spinner size={12} />
          ) : (
            <FileDown size={12} strokeWidth={2} aria-hidden="true" />
          )}
          {printingThis ? 'Preparing' : 'Print'}
        </button>
      </div>

      {isOpen && (
        <div id={panelId} className="border-t border-rule bg-raised pt-4">
          {prescription.notes && (
            <p className="px-5 pb-4 text-sm leading-relaxed text-ink-2">
              {prescription.notes}
            </p>
          )}
          <Medications items={items} />
        </div>
      )}
    </li>
  )
}

export default function PrescriptionsPage() {
  const prescriptions = useAllPrescriptions()
  const patients = usePatientOptions()
  const doctors = useDoctorOptions()

  const [patientFilter, setPatientFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [openId, setOpenId] = useState(null)

  const createMutation = useCreatePrescription({ onSuccess: () => setCreateOpen(false) })
  const print = usePrescriptionDocument()

  const patientNames = useMemo(() => {
    const map = new Map()
    for (const patient of patients.data ?? []) map.set(patient.id, patient.name)
    return map
  }, [patients.data])

  const doctorNames = useMemo(() => {
    const map = new Map()
    for (const doctor of doctors.data ?? []) map.set(doctor.id, doctor.name)
    return map
  }, [doctors.data])

  const rows = useMemo(() => {
    let list = [...(prescriptions.data ?? [])]
    if (patientFilter) {
      list = list.filter((rx) => String(rx.patientId) === String(patientFilter))
    }
    return list.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
  }, [prescriptions.data, patientFilter])

  const total = prescriptions.data?.length ?? 0

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Prescriptions"
        description={
          prescriptions.isLoading
            ? 'Reading the prescription record…'
            : `${total} written, most recent first. Each one prints as an A4 document.`
        }
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            Write prescription
          </button>
        }
      />

      {prescriptions.isError && (
        <ErrorBanner
          className="mb-6"
          title="Prescriptions could not be loaded"
          message={prescriptions.error?.message}
          onRetry={prescriptions.refetch}
        />
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-5 py-3">
          <div className="w-full max-w-[15rem]">
            <label className="sr-only" htmlFor="rx-patient-filter">
              Filter by patient
            </label>
            <select
              id="rx-patient-filter"
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

          <p aria-live="polite" className="text-meta text-ink-3">
            {patientFilter
              ? `${rows.length} for this patient`
              : `${total} in the record`}
          </p>
        </div>

        {prescriptions.isLoading && <SkeletonRows rows={4} label="Loading prescriptions" />}

        {!prescriptions.isLoading && rows.length === 0 && (
          <EmptyState
            icon={Pill}
            title={
              patientFilter
                ? 'Nothing prescribed for this patient'
                : 'No prescriptions written yet'
            }
            description={
              patientFilter
                ? 'Choose “Every patient” to see the rest of the record.'
                : 'A prescription written against a consultation appears here, ready to print.'
            }
            action={
              !patientFilter && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Write the first one
                </button>
              )
            }
          />
        )}

        {!prescriptions.isLoading && rows.length > 0 && (
          <ul className="divide-y divide-rule">
            {rows.map((prescription) => (
              <Row
                key={prescription.id}
                prescription={prescription}
                isOpen={openId === prescription.id}
                onToggle={() =>
                  setOpenId((current) => (current === prescription.id ? null : prescription.id))
                }
                print={print}
                patientName={
                  patientNames.get(prescription.patientId) ||
                  `Patient ${prescription.patientId}`
                }
                doctorName={
                  doctorNames.get(prescription.doctorId) || `Doctor ${prescription.doctorId}`
                }
              />
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Write a prescription"
        description="The patient, the prescriber and at least one medicine are required."
        size="lg"
      >
        <PrescriptionForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </>
  )
}
