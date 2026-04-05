/**
 * DoctorsPage.jsx — Full CRUD interface for Doctor management.
 */
import { useState, useMemo } from 'react'
import { UserPlus, Search, Pencil, Trash2, Stethoscope } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Avatar from '../../components/ui/Avatar'
import { PageSpinner } from '../../components/ui/LoadingSpinner'
import DoctorForm from './DoctorForm'
import {
  useDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
} from '../../hooks/useDoctors'

// Specialty badge colours — cycles through a set
const SPECIALTY_COLORS = [
  'bg-teal-500/10 text-teal-400',
  'bg-blue-500/10 text-blue-400',
  'bg-violet-500/10 text-violet-400',
  'bg-amber-500/10 text-amber-400',
  'bg-rose-500/10 text-rose-400',
  'bg-emerald-500/10 text-emerald-400',
]
function specialtyColor(specialty = '') {
  const idx = specialty.charCodeAt(0) % SPECIALTY_COLORS.length
  return SPECIALTY_COLORS[idx]
}

export default function DoctorsPage() {
  const { data: doctors = [], isLoading, error, refetch } = useDoctors()

  const [createOpen,  setCreateOpen]  = useState(false)
  const [editDoctor,  setEditDoctor]  = useState(null)
  const [deleteDoctor, setDeleteDoctor] = useState(null)
  const [search,      setSearch]      = useState('')

  const createMutation = useCreateDoctor({ onSuccess: () => setCreateOpen(false) })
  const updateMutation = useUpdateDoctor({ onSuccess: () => setEditDoctor(null) })
  const deleteMutation = useDeleteDoctor({ onSuccess: () => setDeleteDoctor(null) })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return doctors
    return doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.specialty?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
    )
  }, [doctors, search])

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="page-header">
        <div>
          <h2 className="section-title">Doctors</h2>
          <p className="text-muted mt-1">
            {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} on staff
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <UserPlus size={16} />
          Add Doctor
        </button>
      </div>

      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      <div className="card overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, specialty, email…"
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

        {isLoading && <PageSpinner />}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Stethoscope}
            title={search ? 'No doctors match your search' : 'No doctors yet'}
            description={search ? 'Try a different search term.' : 'Add your first doctor to get started.'}
            action={!search && (
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <UserPlus size={15} /> Add First Doctor
              </button>
            )}
          />
        )}

        {!isLoading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Doctor
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">
                  Specialty
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doctor, i) => (
                <tr
                  key={doctor.id}
                  className="table-row animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={doctor.name} size="md" />
                      <div>
                        <p className="font-medium text-white">Dr. {doctor.name}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{doctor.specialty}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`badge ${specialtyColor(doctor.specialty)}`}>
                      {doctor.specialty}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">
                    {doctor.email}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-icon"
                        title="Edit doctor"
                        onClick={() => setEditDoctor(doctor)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-danger py-1.5 px-2"
                        title="Delete doctor"
                        onClick={() => setDeleteDoctor(doctor)}
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

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Doctor">
        <DoctorForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={!!editDoctor} onClose={() => setEditDoctor(null)} title="Edit Doctor">
        <DoctorForm
          initialData={editDoctor}
          onSubmit={(data) => updateMutation.mutate({ id: editDoctor.id, data })}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteDoctor}
        onClose={() => setDeleteDoctor(null)}
        onConfirm={() => deleteMutation.mutate(deleteDoctor?.id)}
        isLoading={deleteMutation.isPending}
        title="Delete Doctor"
        message={`Are you sure you want to remove "Dr. ${deleteDoctor?.name}" from the system?`}
        confirmLabel="Delete Doctor"
      />
    </div>
  )
}
