/**
 * PatientSelector.jsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable patient picker dropdown used in Billing, Prescriptions,
 * and Labs pages to filter or associate records with a patient.
 * ─────────────────────────────────────────────────────────────────
 */
import { usePatients } from '../../hooks/usePatients'

export default function PatientSelector({
  value,
  onChange,
  label = 'Patient',
  placeholder = 'Select a patient…',
  error,
  disabled = false,
  required = false,
}) {
  const { data: patients = [], isLoading } = usePatients()

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
          {isLoading ? 'Loading patients…' : placeholder}
        </option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.email}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
