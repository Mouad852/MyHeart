/**
 * PatientsPage.jsx — the register.
 *
 * The job of this screen is search → scan → identify → open, and everything on
 * it is arranged around that. The search field is the first thing in the panel
 * and it queries the database rather than the loaded page; the rows are dense
 * enough to scan a screenful at a glance; the patient's name is the link, so
 * the thing you read is the thing you click.
 *
 * The actions column is gone. It held a pencil and a red bin on every row —
 * eight identical destructive buttons on a register of eight people, none of
 * which is the reason anybody comes to this page. Editing and deleting live in
 * the row menu, where deleting a patient takes a deliberate second click.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Search, Trash2, UserPlus, Users, X } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Avatar from '../../components/ui/Avatar'
import Menu from '../../components/ui/Menu'
import PageHeader from '../../components/ui/Page'
import { Panel } from '../../components/ui/Panel'
import Pagination from '../../components/ui/Pagination'
import { Skeleton, SkeletonText } from '../../components/ui/LoadingSpinner'
import PatientForm from './PatientForm'
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from '../../hooks/usePatients'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatDate, formatPhone, reference } from '../../utils'

function LoadingRows() {
  return Array.from({ length: 6 }, (_, i) => (
    <tr key={i}>
      <td className="td">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <SkeletonText chars={18} />
        </div>
      </td>
      <td className="td hidden sm:table-cell">
        <SkeletonText chars={7} />
      </td>
      <td className="td hidden md:table-cell">
        <SkeletonText chars={22} />
      </td>
      <td className="td hidden lg:table-cell">
        <SkeletonText chars={14} />
      </td>
      <td className="td hidden xl:table-cell">
        <SkeletonText chars={11} />
      </td>
      <td className="td" />
    </tr>
  ))
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  // Without a debounce this fires a query on every keystroke.
  const debounced = useDebouncedValue(search)

  const { data, isLoading, isFetching, error, refetch } = usePatients({
    page,
    q: debounced,
  })

  const patients = data?.content ?? []
  const total = data?.totalElements ?? 0

  // A narrower search can otherwise leave the reader stranded past the last page.
  useEffect(() => setPage(0), [debounced])

  const [createOpen, setCreateOpen] = useState(false)
  const [editPatient, setEditPatient] = useState(null)
  const [deletePatient, setDeletePatient] = useState(null)

  const createMutation = useCreatePatient({ onSuccess: () => setCreateOpen(false) })
  const updateMutation = useUpdatePatient({ onSuccess: () => setEditPatient(null) })
  const deleteMutation = useDeletePatient({ onSuccess: () => setDeletePatient(null) })

  const searching = Boolean(debounced.trim())

  return (
    <>
      <PageHeader
        eyebrow="Clinic"
        title="Patients"
        description={
          isLoading
            ? 'Reading the register…'
            : `${total} ${total === 1 ? 'person' : 'people'} on the register.`
        }
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <UserPlus size={14} strokeWidth={2} aria-hidden="true" />
            New patient
          </button>
        }
      />

      {error && (
        <ErrorBanner
          className="mb-6"
          title="The register could not be loaded"
          message={error.message}
          onRetry={refetch}
        />
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-5 py-3">
          <div className="relative w-full max-w-sm">
            <Search
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or phone"
              aria-label="Search the register"
              className="input h-9 bg-raised py-0 pl-9 pr-9
 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear the search"
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2
                           items-center justify-center rounded text-ink-3 hover:text-ink"
              >
                <X size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Says what the count refers to. A bare number next to a search box
              is ambiguous between "found" and "in total". */}
          <p aria-live="polite" className="text-meta text-ink-3">
            {searching
              ? `${total} ${total === 1 ? 'match' : 'matches'}`
              : `${total} registered`}
            {isFetching && !isLoading && <span className="ml-2 text-ink-3">updating…</span>}
          </p>
        </div>

        {!isLoading && patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searching ? 'Nobody matches that' : 'The register is empty'}
            description={
              searching
                ? 'Try part of a surname, or the start of an email address.'
                : 'Register the first patient and they will appear here.'
            }
            action={
              !searching && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(true)}
                >
                  <UserPlus size={14} strokeWidth={2} aria-hidden="true" />
                  Register a patient
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th pl-5">Patient</th>
                  <th className="th ident hidden sm:table-cell">Ref</th>
                  <th className="th hidden md:table-cell">Email</th>
                  <th className="th hidden lg:table-cell">Phone</th>
                  <th className="th hidden xl:table-cell">Registered</th>
                  <th className="th pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <LoadingRows />
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="row-hover">
                      <td className="td pl-5">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="flex items-center gap-3 rounded"
                        >
                          <Avatar name={patient.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">
                              {patient.name}
                            </span>
                            {/* The columns hidden at this width fold into the
                                name cell rather than disappearing. */}
                            <span className="block truncate text-meta text-ink-3 md:hidden">
                              {patient.email || patient.phone}
                            </span>
                          </span>
                        </Link>
                      </td>

                      <td className="td ident hidden text-ink-2 sm:table-cell">
                        {reference('P', patient.id)}
                      </td>

                      <td className="td hidden text-ink-2 md:table-cell">
                        {patient.email || <span className="text-ink-3">—</span>}
                      </td>

                      <td className="td ident hidden whitespace-nowrap text-ink-2 lg:table-cell">
                        {patient.phone ? (
                          formatPhone(patient.phone)
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </td>

                      <td className="td hidden text-meta text-ink-3 xl:table-cell">
                        {formatDate(patient.createdAt, 'd MMM yyyy')}
                      </td>

                      <td className="td pr-5">
                        <div className="flex justify-end">
                          <Menu
                            label={`Actions for ${patient.name}`}
                            items={[
                              {
                                label: 'Edit details',
                                icon: Pencil,
                                onSelect: () => setEditPatient(patient),
                              },
                              {
                                label: 'Delete patient',
                                icon: Trash2,
                                danger: true,
                                onSelect: () => setDeletePatient(patient),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && patients.length > 0 && (
          <p className="note border-t border-rule px-5 py-3">
            The name is the link, so the thing you read is the thing you click.
            Editing and deleting live in the row menu, not in a column of
            destructive buttons.
          </p>
        )}

        {!isLoading && data && (
          <Pagination
            page={data.page}
            size={data.size}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            first={data.first}
            last={data.last}
            onChange={setPage}
          />
        )}
      </Panel>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register a patient"
        description="Only a name is required. Contact details can be added later."
      >
        <PatientForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={Boolean(editPatient)}
        onClose={() => setEditPatient(null)}
        title="Edit patient details"
      >
        <PatientForm
          initialData={editPatient}
          onSubmit={(data) => updateMutation.mutate({ id: editPatient.id, data })}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletePatient)}
        onClose={() => setDeletePatient(null)}
        onConfirm={() => deleteMutation.mutate(deletePatient?.id)}
        isLoading={deleteMutation.isPending}
        busyLabel="Deleting…"
        title="Delete this patient?"
        message={`${deletePatient?.name}'s record will be removed from the register permanently. Their appointments, prescriptions and invoices are held by other services and are not deleted with it.`}
        confirmLabel="Delete the record"
      />
    </>
  )
}
