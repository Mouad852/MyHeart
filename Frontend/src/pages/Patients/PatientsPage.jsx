/**
 * PatientsPage.jsx — Full CRUD interface for Patient management.
 *
 * Features:
 *  - Live search filter
 *  - Create patient (modal)
 *  - Edit patient (modal)
 *  - Delete patient (confirm dialog)
 *  - Loading / error / empty states
 */
import { useState, useMemo } from 'react'
import { UserPlus, Search, Pencil, Trash2, Users } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Avatar from '../../components/ui/Avatar'
import { PageSpinner } from '../../components/ui/LoadingSpinner'
import PatientForm from './PatientForm'
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from '../../hooks/usePatients'
import { formatDate } from '../../utils'

export default function PatientsPage() {
  const { data: patients = [], isLoading, error, refetch } = usePatients()

  // Modal states
  const [createOpen,    setCreateOpen]    = useState(false)
  const [editPatient,   setEditPatient]   = useState(null) // patient object or null
  const [deletePatient, setDeletePatient] = useState(null) // patient object or null
  const [search,        setSearch]        = useState('')

  // Mutations
  const createMutation = useCreatePatient({ onSuccess: () => setCreateOpen(false) })
  const updateMutation = useUpdatePatient({ onSuccess: () => setEditPatient(null) })
  const deleteMutation = useDeletePatient({ onSuccess: () => setDeletePatient(null) })

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    )
  }, [patients, search])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Patients</h2>
          <p className="text-muted mt-1">
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'} registered
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <UserPlus size={16} />
          New Patient
        </button>
      </div>

      {/* Error state */}
      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {/* Main card */}
      <div className="card overflow-hidden">

        {/* Table toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-2 text-sm"
            />
          </div>
          {search && (
            <span className="text-xs text-slate-500">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && <PageSpinner />}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title={search ? 'No patients match your search' : 'No patients yet'}
            description={search ? 'Try a different search term.' : 'Create your first patient record to get started.'}
            action={!search && (
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <UserPlus size={15} /> Add First Patient
              </button>
            )}
          />
        )}

        {/* Table */}
        {!isLoading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Patient
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">
                  Phone
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden xl:table-cell">
                  Added
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient, i) => (
                <tr
                  key={patient.id}
                  className="table-row animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  {/* Name + avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={patient.name} size="md" />
                      <div>
                        <p className="font-medium text-white">{patient.name}</p>
                        <p className="text-xs text-slate-500 md:hidden">{patient.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">
                    {patient.email}
                  </td>

                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">
                    {patient.phone}
                  </td>

                  <td className="px-6 py-4 text-slate-500 text-xs hidden xl:table-cell">
                    {formatDate(patient.createdAt, 'MMM d, yyyy')}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-icon"
                        title="Edit patient"
                        onClick={() => setEditPatient(patient)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-danger py-1.5 px-2"
                        title="Delete patient"
                        onClick={() => setDeletePatient(patient)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register New Patient"
      >
        <PatientForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editPatient}
        onClose={() => setEditPatient(null)}
        title="Edit Patient"
      >
        <PatientForm
          initialData={editPatient}
          onSubmit={(data) => updateMutation.mutate({ id: editPatient.id, data })}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletePatient}
        onClose={() => setDeletePatient(null)}
        onConfirm={() => deleteMutation.mutate(deletePatient?.id)}
        isLoading={deleteMutation.isPending}
        title="Delete Patient"
        message={`Are you sure you want to permanently delete "${deletePatient?.name}"? This cannot be undone.`}
        confirmLabel="Delete Patient"
      />
    </div>
  )
}
