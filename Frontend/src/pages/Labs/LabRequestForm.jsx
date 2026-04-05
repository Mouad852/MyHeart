/**
 * LabRequestForm.jsx — Form for creating a new lab test request.
 */
import { useState } from 'react'
import { Spinner } from '../../components/ui/LoadingSpinner'
import PatientSelector from '../../components/ui/PatientSelector'
import DoctorSelector from '../../components/ui/DoctorSelector'

const LAB_TESTS = [
  'Complete Blood Count (CBC)',
  'Basic Metabolic Panel (BMP)',
  'Comprehensive Metabolic Panel (CMP)',
  'Lipid Panel',
  'Thyroid Function (TSH)',
  'HbA1c (Glycated Haemoglobin)',
  'Liver Function Tests (LFT)',
  'Kidney Function Tests (KFT)',
  'Urine Analysis',
  'Blood Culture',
  'COVID-19 PCR',
  'Chest X-Ray',
  'ECG',
  'MRI Brain',
  'CT Scan Abdomen',
  'Echocardiogram',
  'Other (specify in notes)',
]

const EMPTY = { patientId: '', doctorId: '', testName: '', notes: '' }

export default function LabRequestForm({ onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.patientId) e.patientId = 'Patient is required'
    if (!form.doctorId)  e.doctorId  = 'Doctor is required'
    if (!form.testName)  e.testName  = 'Test name is required'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      patientId: Number(form.patientId),
      doctorId:  Number(form.doctorId),
      testName:  form.testName,
      notes:     form.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PatientSelector
          value={form.patientId}
          onChange={(v) => set('patientId', v)}
          error={errors.patientId}
          required
        />
        <DoctorSelector
          value={form.doctorId}
          onChange={(v) => set('doctorId', v)}
          error={errors.doctorId}
          required
        />
      </div>

      <div>
        <label className="label">Test Name <span className="text-red-400">*</span></label>
        <select
          value={form.testName}
          onChange={(e) => set('testName', e.target.value)}
          className={`input ${errors.testName ? 'border-red-500/50' : ''}`}
          disabled={isLoading}
        >
          <option value="">Select a test…</option>
          {LAB_TESTS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.testName && <p className="text-xs text-red-400 mt-1.5">{errors.testName}</p>}
      </div>

      <div>
        <label className="label">
          Notes <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="Clinical context, special instructions, urgency…"
          className="input resize-none"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <Spinner size={14} />}
          {isLoading ? 'Submitting…' : 'Create Lab Request'}
        </button>
      </div>
    </form>
  )
}
