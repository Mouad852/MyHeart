/**
 * PrescriptionForm.jsx
 * ─────────────────────────────────────────────────────────────────
 * Dynamic form for creating a prescription with multiple medicines.
 * Users can add/remove medicine rows.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Spinner } from '../../components/ui/LoadingSpinner'
import PatientSelector from '../../components/ui/PatientSelector'
import DoctorSelector from '../../components/ui/DoctorSelector'

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '' }
const EMPTY_FORM = { patientId: '', doctorId: '', diagnosis: '', medicines: [{ ...EMPTY_MEDICINE }] }

const FREQUENCIES = ['Once daily', 'Twice daily', '3× daily', '4× daily', 'Every 8 hours', 'Every 12 hours', 'As needed', 'Weekly']
const DURATIONS   = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months', 'Ongoing']

export default function PrescriptionForm({ onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const setField = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  const setMedicine = (index, field, value) => {
    setForm((p) => {
      const medicines = [...p.medicines]
      medicines[index] = { ...medicines[index], [field]: value }
      return { ...p, medicines }
    })
    // Clear medicine-level error
    const key = `medicine_${index}_${field}`
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
  }

  const addMedicine = () =>
    setForm((p) => ({ ...p, medicines: [...p.medicines, { ...EMPTY_MEDICINE }] }))

  const removeMedicine = (index) =>
    setForm((p) => ({ ...p, medicines: p.medicines.filter((_, i) => i !== index) }))

  const validate = () => {
    const e = {}
    if (!form.patientId) e.patientId = 'Patient is required'
    if (!form.doctorId)  e.doctorId  = 'Doctor is required'

    form.medicines.forEach((m, i) => {
      if (!m.name.trim())      e[`medicine_${i}_name`]      = 'Medicine name is required'
      if (!m.dosage.trim())    e[`medicine_${i}_dosage`]    = 'Dosage is required'
      if (!m.frequency.trim()) e[`medicine_${i}_frequency`] = 'Frequency is required'
      if (!m.duration.trim())  e[`medicine_${i}_duration`]  = 'Duration is required'
    })
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      patientId: Number(form.patientId),
      doctorId:  Number(form.doctorId),
      diagnosis: form.diagnosis.trim() || undefined,
      medicines: form.medicines,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Patient + Doctor row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PatientSelector
          value={form.patientId}
          onChange={(v) => setField('patientId', v)}
          error={errors.patientId}
          required
        />
        <DoctorSelector
          value={form.doctorId}
          onChange={(v) => setField('doctorId', v)}
          error={errors.doctorId}
          required
        />
      </div>

      {/* Diagnosis */}
      <div>
        <label className="label">
          Diagnosis <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={form.diagnosis}
          onChange={(e) => setField('diagnosis', e.target.value)}
          placeholder="e.g. Hypertension, Seasonal allergies…"
          className="input"
          disabled={isLoading}
        />
      </div>

      {/* ── Medicines list ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">
            Medicines <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={addMedicine}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-teal-400
                       hover:text-teal-300 font-semibold transition-colors"
          >
            <Plus size={13} /> Add Medicine
          </button>
        </div>

        <div className="space-y-3">
          {form.medicines.map((med, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-navy-900/60 border border-white/8 space-y-3
                         animate-slide-up"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Medicine {i + 1}
                </span>
                {form.medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(i)}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400
                               hover:bg-red-500/10 transition-all duration-150"
                    title="Remove medicine"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Name + Dosage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => setMedicine(i, 'name', e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className={`input text-sm ${errors[`medicine_${i}_name`] ? 'border-red-500/50' : ''}`}
                    disabled={isLoading}
                  />
                  {errors[`medicine_${i}_name`] && (
                    <p className="text-xs text-red-400 mt-1">{errors[`medicine_${i}_name`]}</p>
                  )}
                </div>
                <div>
                  <label className="label">Dosage</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => setMedicine(i, 'dosage', e.target.value)}
                    placeholder="e.g. 500mg"
                    className={`input text-sm ${errors[`medicine_${i}_dosage`] ? 'border-red-500/50' : ''}`}
                    disabled={isLoading}
                  />
                  {errors[`medicine_${i}_dosage`] && (
                    <p className="text-xs text-red-400 mt-1">{errors[`medicine_${i}_dosage`]}</p>
                  )}
                </div>
              </div>

              {/* Frequency + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Frequency</label>
                  <select
                    value={med.frequency}
                    onChange={(e) => setMedicine(i, 'frequency', e.target.value)}
                    className={`input text-sm ${errors[`medicine_${i}_frequency`] ? 'border-red-500/50' : ''}`}
                    disabled={isLoading}
                  >
                    <option value="">Select…</option>
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {errors[`medicine_${i}_frequency`] && (
                    <p className="text-xs text-red-400 mt-1">{errors[`medicine_${i}_frequency`]}</p>
                  )}
                </div>
                <div>
                  <label className="label">Duration</label>
                  <select
                    value={med.duration}
                    onChange={(e) => setMedicine(i, 'duration', e.target.value)}
                    className={`input text-sm ${errors[`medicine_${i}_duration`] ? 'border-red-500/50' : ''}`}
                    disabled={isLoading}
                  >
                    <option value="">Select…</option>
                    {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors[`medicine_${i}_duration`] && (
                    <p className="text-xs text-red-400 mt-1">{errors[`medicine_${i}_duration`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <Spinner size={14} />}
          {isLoading ? 'Saving…' : 'Create Prescription'}
        </button>
      </div>
    </form>
  )
}
