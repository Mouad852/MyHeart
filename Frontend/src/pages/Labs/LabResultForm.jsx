/**
 * LabResultForm.jsx — Submit a result for an existing lab request.
 */
import { useState } from 'react'
import { Spinner } from '../../components/ui/LoadingSpinner'

const EMPTY = { result: '', notes: '' }

export default function LabResultForm({ requestId, requestName, onSubmit, isLoading }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.result.trim()) e.result = 'Result is required'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      requestId: Number(requestId),
      result:    form.result.trim(),
      notes:     form.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Context */}
      {requestName && (
        <div className="p-3.5 rounded-xl bg-navy-900/60 border border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Test</p>
          <p className="text-sm font-medium text-white">{requestName}</p>
        </div>
      )}

      <div>
        <label className="label">Result <span className="text-red-400">*</span></label>
        <textarea
          value={form.result}
          onChange={(e) => set('result', e.target.value)}
          rows={4}
          placeholder="Enter test findings, values, or a summary…"
          className={`input resize-none leading-relaxed ${errors.result ? 'border-red-500/50' : ''}`}
          disabled={isLoading}
        />
        {errors.result && <p className="text-xs text-red-400 mt-1.5">{errors.result}</p>}
      </div>

      <div>
        <label className="label">
          Notes <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Additional observations, follow-up recommendations…"
          className="input resize-none"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <Spinner size={14} />}
          {isLoading ? 'Submitting…' : 'Submit Result'}
        </button>
      </div>
    </form>
  )
}
