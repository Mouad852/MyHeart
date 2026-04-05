/**
 * InvoiceForm.jsx — Modal form for creating a new invoice.
 */
import { useState } from 'react'
import { Spinner } from '../../components/ui/LoadingSpinner'
import PatientSelector from '../../components/ui/PatientSelector'

const EMPTY = {
  patientId:      '',
  appointmentId:  '',
  amount:         '',
  description:    '',
}

export default function InvoiceForm({ onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.patientId)                           e.patientId    = 'Patient is required'
    if (!form.amount)                              e.amount       = 'Amount is required'
    else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0)
                                                   e.amount       = 'Enter a valid positive amount'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      patientId:     Number(form.patientId),
      appointmentId: form.appointmentId ? Number(form.appointmentId) : undefined,
      amount:        Number(form.amount),
      description:   form.description.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <PatientSelector
        value={form.patientId}
        onChange={(v) => set('patientId', v)}
        error={errors.patientId}
        required
      />

      <div>
        <label className="label">Appointment ID <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span></label>
        <input
          type="number"
          value={form.appointmentId}
          onChange={(e) => set('appointmentId', e.target.value)}
          placeholder="Link to an appointment…"
          className="input"
          disabled={isLoading}
          min="1"
        />
      </div>

      <div>
        <label className="label">Amount (USD) <span className="text-red-400">*</span></label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className={`input pl-8 ${errors.amount ? 'border-red-500/50' : ''}`}
            disabled={isLoading}
          />
        </div>
        {errors.amount && <p className="text-xs text-red-400 mt-1.5">{errors.amount}</p>}
      </div>

      <div>
        <label className="label">Description <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span></label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Consultation fee, procedure costs…"
          className="input resize-none leading-relaxed"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <Spinner size={14} />}
          {isLoading ? 'Creating…' : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}
