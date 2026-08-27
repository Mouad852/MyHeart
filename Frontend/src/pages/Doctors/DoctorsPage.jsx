/**
 * DoctorsPage.jsx — who practises here.
 *
 * The same table as the patient register, deliberately: two lists of people in
 * one product should not be two different designs. What differs is what the
 * list is for. A doctor is looked up by *what they do*, so specialty is a
 * first-class column and the list can be narrowed to one specialty in a click.
 *
 * Specialties are not colour-coded. The previous version assigned each one a
 * different accent, which produced a column of violet, amber, blue and rose
 * badges saying nothing about urgency or state — the two things colour is for
 * in this product.
 */
import { useEffect, useMemo, useState } from 'react'
import { Pencil, Search, Stethoscope, Trash2, UserPlus, X } from 'lucide-react'
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
import DoctorForm from './DoctorForm'
import {
  useDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
} from '../../hooks/useDoctors'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatPhone } from '../../utils'

export default function DoctorsPage() {
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [page, setPage] = useState(0)
  const debounced = useDebouncedValue(search)

  const { data, isLoading, error, refetch } = useDoctors({ page, q: debounced })
  const doctors = useMemo(() => data?.content ?? [], [data])
  const total = data?.totalElements ?? 0

  useEffect(() => setPage(0), [debounced])

  const [createOpen, setCreateOpen] = useState(false)
  const [editDoctor, setEditDoctor] = useState(null)
  const [deleteDoctor, setDeleteDoctor] = useState(null)

  const createMutation = useCreateDoctor({ onSuccess: () => setCreateOpen(false) })
  const updateMutation = useUpdateDoctor({ onSuccess: () => setEditDoctor(null) })
  const deleteMutation = useDeleteDoctor({ onSuccess: () => setDeleteDoctor(null) })

  // Built from the page in hand, because the server has no specialty facet.
  const specialties = useMemo(
    () => [...new Set(doctors.map((d) => d.specialty).filter(Boolean))].sort(),
    [doctors]
  )

  const rows = specialty ? doctors.filter((d) => d.specialty === specialty) : doctors
  const searching = Boolean(debounced.trim())

  return (
    <>
      <PageHeader
        eyebrow="Clinic"
        title="Doctors"
        description={
          isLoading
            ? 'Reading the staff list…'
            : `${total} ${total === 1 ? 'doctor' : 'doctors'} practising at the clinic.`
        }
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <UserPlus size={14} strokeWidth={2} aria-hidden="true" />
            Add doctor
          </button>
        }
      />

      {error && (
        <ErrorBanner
          className="mb-6"
          title="The staff list could not be loaded"
          message={error.message}
          onRetry={refetch}
        />
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-5 py-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
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
                placeholder="Search by name or specialty"
                aria-label="Search the staff list"
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

            {specialties.length > 1 && (
              <div className="w-full max-w-[13rem]">
                <label className="sr-only" htmlFor="doctor-specialty-filter">
                  Filter by specialty
                </label>
                <select
                  id="doctor-specialty-filter"
                  className="select h-9 py-0 text-sm"
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                >
                  <option value="">Every specialty</option>
                  {specialties.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p aria-live="polite" className="text-meta text-ink-3">
            {searching ? `${total} ${total === 1 ? 'match' : 'matches'}` : `${total} on staff`}
          </p>
        </div>

        {!isLoading && rows.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title={
              searching || specialty ? 'Nobody matches that' : 'No doctors on the staff list'
            }
            description={
              searching || specialty
                ? 'Try a shorter search, or clear the specialty filter.'
                : 'Add the doctors who practise here so appointments can be booked against them.'
            }
            action={
              !searching &&
              !specialty && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(true)}
                >
                  <UserPlus size={14} strokeWidth={2} aria-hidden="true" />
                  Add a doctor
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th pl-5">Doctor</th>
                  <th className="th hidden sm:table-cell">Specialty</th>
                  <th className="th hidden md:table-cell">Email</th>
                  <th className="th hidden lg:table-cell">Phone</th>
                  <th className="th pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i}>
                        <td className="td pl-5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <SkeletonText chars={16} />
                          </div>
                        </td>
                        <td className="td hidden sm:table-cell">
                          <SkeletonText chars={12} />
                        </td>
                        <td className="td hidden md:table-cell">
                          <SkeletonText chars={20} />
                        </td>
                        <td className="td hidden lg:table-cell">
                          <SkeletonText chars={16} />
                        </td>
                        <td className="td" />
                      </tr>
                    ))
                  : rows.map((doctor) => (
                      <tr key={doctor.id} className="row-hover">
                        <td className="td pl-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={doctor.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">{doctor.name}</p>
                              <p className="truncate text-meta text-ink-3 sm:hidden">
                                {doctor.specialty}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="td hidden text-ink-2 sm:table-cell">
                          {doctor.specialty || <span className="text-ink-3">—</span>}
                        </td>

                        <td className="td hidden text-ink-2 md:table-cell">
                          {doctor.email || <span className="text-ink-3">—</span>}
                        </td>

                        <td className="td ident hidden whitespace-nowrap text-ink-2 lg:table-cell">
                          {doctor.phone ? (
                            formatPhone(doctor.phone)
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </td>

                        <td className="td pr-5">
                          <div className="flex justify-end">
                            <Menu
                              label={`Actions for ${doctor.name}`}
                              items={[
                                {
                                  label: 'Edit details',
                                  icon: Pencil,
                                  onSelect: () => setEditDoctor(doctor),
                                },
                                {
                                  label: 'Remove from staff',
                                  icon: Trash2,
                                  danger: true,
                                  onSelect: () => setDeleteDoctor(doctor),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <p className="note border-t border-rule px-5 py-3">
            Specialities are not colour-coded. A column of violet, amber and blue
            badges would say which department a row belongs to, which is not a
            thing anybody needs colour for.
          </p>
        )}

        {!isLoading && data && !specialty && (
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
        title="Add a doctor"
      >
        <DoctorForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={Boolean(editDoctor)}
        onClose={() => setEditDoctor(null)}
        title="Edit doctor details"
      >
        <DoctorForm
          initialData={editDoctor}
          onSubmit={(data) => updateMutation.mutate({ id: editDoctor.id, data })}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteDoctor)}
        onClose={() => setDeleteDoctor(null)}
        onConfirm={() => deleteMutation.mutate(deleteDoctor?.id)}
        isLoading={deleteMutation.isPending}
        busyLabel="Removing…"
        title="Remove this doctor?"
        message={`${deleteDoctor?.name} will be removed from the staff list. Appointments already booked against them are held by the appointment service and are not deleted with the record.`}
        confirmLabel="Remove from staff"
      />
    </>
  )
}
