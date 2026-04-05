/**
 * DoctorSelector.jsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable doctor picker dropdown used in Prescriptions and Labs.
 * ─────────────────────────────────────────────────────────────────
 */
import { useDoctors } from '../../hooks/useDoctors'

export default function DoctorSelector({
  value,
  onChange,
  label = 'Doctor',
  placeholder = 'Select a doctor…',
  error,
  disabled = false,
  required = false,
}) {
  const { data: doctors = [], isLoading } = useDoctors()

  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input ${error ? 'border-red-500/50 focus:border-red-500' : ''}`}
        disabled={disabled || isLoading}
      >
        <option value="">
          {isLoading ? 'Loading doctors…' : placeholder}
        </option>
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            Dr. {d.name} — {d.specialty}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
