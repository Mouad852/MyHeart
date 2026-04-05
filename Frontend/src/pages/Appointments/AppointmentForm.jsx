/**
 * AppointmentForm.jsx — Create a new appointment.
 * Fetches the patient and doctor lists to populate dropdowns.
 * Validates that the appointment date is in the future.
 */
import { useState } from 'react'
import { Spinner } from '../../components/ui/LoadingSpinner'
import { usePatients } from '../../hooks/usePatients'
import { useDoctors } from '../../hooks/useDoctors'
import { getMinAppointmentDate } from '../../utils'

const EMPTY = { patientId: '', doctorId: '', appointmentDate: '', notes: '' }

export default function AppointmentForm({ onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const { data: patients = [], isLoading: pLoading } = usePatients()
  const { data: doctors  = [], isLoading: dLoading } = useDoctors()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.patientId)       errs.patientId       = 'Please select a patient'
    if (!form.doctorId)        errs.doctorId        = 'Please select a doctor'
    if (!form.appointmentDate) errs.appointmentDate = 'Please select a date and time'
    else {
      const selected = new Date(form.appointmentDate)
      if (selected <= new Date()) errs.appointmentDate = 'Appointment must be in the future'
    }
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    // Convert local datetime string to ISO format for the backend
    const payload = {
      patientId:       Number(form.patientId),
      doctorId:        Number(form.doctorId),
      appointmentDate: new Date(form.appointmentDate).toISOString(),
      notes:           form.notes.trim() || undefined,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Patient selector */}
      <div>
        <label className="label">Patient</label>
        <select
          name="patientId"
          value={form.patientId}
          onChange={handleChange}
          className={`input ${errors.patientId ? 'border-red-500/50' : ''}`}
          disabled={isLoading || pLoading}
        >
          <option value="">
            {pLoading ? 'Loading patients…' : 'Select a patient…'}
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.email}
            </option>
          ))}
        </select>
        {errors.patientId && <p className="text-xs text-red-400 mt-1.5">{errors.patientId}</p>}
      </div>

      {/* Doctor selector */}
      <div>
        <label className="label">Doctor</label>
        <select
          name="doctorId"
          value={form.doctorId}
          onChange={handleChange}
          className={`input ${errors.doctorId ? 'border-red-500/50' : ''}`}
          disabled={isLoading || dLoading}
        >
          <option value="">
            {dLoading ? 'Loading doctors…' : 'Select a doctor…'}
          </option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              Dr. {d.name} — {d.specialty}
            </option>
          ))}
        </select>
        {errors.doctorId && <p className="text-xs text-red-400 mt-1.5">{errors.doctorId}</p>}
      </div>

      {/* Date & time */}
      <div>
        <label className="label">Date & Time</label>
        <input
          type="datetime-local"
          name="appointmentDate"
          value={form.appointmentDate}
          onChange={handleChange}
          min={getMinAppointmentDate()}
          className={`input ${errors.appointmentDate ? 'border-red-500/50' : ''}`}
          disabled={isLoading}
        />
        {errors.appointmentDate && (
          <p className="text-xs text-red-400 mt-1.5">{errors.appointmentDate}</p>
        )}
      </div>

      {/* Notes (optional) */}
      <div>
        <label className="label">Notes <span className="text-slate-600 normal-case tracking-normal font-normal">(optional)</span></label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Reason for visit, symptoms, special instructions…"
          className="input resize-none leading-relaxed"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <Spinner size={14} />}
          {isLoading ? 'Scheduling…' : 'Book Appointment'}
        </button>
      </div>
    </form>
  )
}
