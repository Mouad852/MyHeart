/**
 * PatientForm.jsx — Shared form for creating and editing patients.
 * Handles local validation before submitting to the API.
 */
import { useState, useEffect } from 'react'
import { Spinner } from '../../components/ui/LoadingSpinner'
import { isValidEmail, isValidPhone } from '../../utils'

const EMPTY = { name: '', email: '', phone: '' }

export default function PatientForm({ initialData = null, onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  // When editing, pre-fill the form with existing data
  useEffect(() => {
    if (initialData) {
      setForm({
        name:  initialData.name  || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())         errs.name  = 'Name is required'
    if (!form.email.trim())        errs.email = 'Email is required'
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address'
    if (!form.phone.trim())        errs.phone = 'Phone is required'
    else if (!isValidPhone(form.phone)) errs.phone = 'Phone must be 7–15 digits'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
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
          placeholder="e.g. Jane Doe"
          className={`input ${errors.name ? 'border-red-500/50 focus:border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="label">Email Address</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="e.g. jane@example.com"
          className={`input ${errors.email ? 'border-red-500/50 focus:border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="label">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="e.g. +1234567890"
          className={`input ${errors.phone ? 'border-red-500/50 focus:border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.phone && <p className="text-xs text-red-400 mt-1.5">{errors.phone}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading && <Spinner size={14} />}
          {isLoading
            ? (initialData ? 'Saving…' : 'Creating…')
            : (initialData ? 'Save Changes' : 'Create Patient')}
        </button>
      </div>
    </form>
  )
}
