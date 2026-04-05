/**
 * DoctorForm.jsx — Shared form for creating and editing doctors.
 */
import { useState, useEffect } from 'react'
import { Spinner } from '../../components/ui/LoadingSpinner'
import { isValidEmail } from '../../utils'

const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Infectious Disease',
  'Internal Medicine',
  'Nephrology',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pathology',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Surgery',
  'Urology',
]

const EMPTY = { name: '', specialty: '', email: '' }

export default function DoctorForm({ initialData = null, onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setForm({
        name:      initialData.name      || '',
        specialty: initialData.specialty || '',
        email:     initialData.email     || '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())      errs.name      = 'Name is required'
    if (!form.specialty.trim()) errs.specialty = 'Specialty is required'
    if (!form.email.trim())     errs.email     = 'Email is required'
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Name */}
      <div>
        <label className="label">Full Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Dr. John Smith"
          className={`input ${errors.name ? 'border-red-500/50' : ''}`}
          disabled={isLoading}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name}</p>}
      </div>

      {/* Specialty */}
      <div>
        <label className="label">Specialty</label>
        <select
          name="specialty"
          value={form.specialty}
          onChange={handleChange}
          className={`input ${errors.specialty ? 'border-red-500/50' : ''}`}
          disabled={isLoading}
        >
          <option value="">Select a specialty…</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.specialty && <p className="text-xs text-red-400 mt-1.5">{errors.specialty}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="label">Email Address</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="e.g. doctor@hospital.com"
          className={`input ${errors.email ? 'border-red-500/50' : ''}`}
          disabled={isLoading}
        />
        {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <Spinner size={14} />}
          {isLoading
            ? (initialData ? 'Saving…' : 'Creating…')
            : (initialData ? 'Save Changes' : 'Add Doctor')}
        </button>
      </div>
    </form>
  )
}
