/**
 * InvoiceDetails.jsx
 * Shows full details of a single invoice with payment action.
 */
import { DollarSign, User, CalendarDays, Hash, FileText } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../utils'

export default function InvoiceDetails({ invoice, onPay, isPaying }) {
  if (!invoice) return null

  const canPay = invoice.status === 'PENDING' || invoice.status === 'OVERDUE'

  return (
    <div className="space-y-5">

      {/* Status + amount hero */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-navy-900/60 border border-white/5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Total Due</p>
          <p className="font-display text-3xl font-bold text-white">
            ${Number(invoice.amount ?? 0).toFixed(2)}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Hash,        label: 'Invoice #',    value: `INV-${String(invoice.id).padStart(5,'0')}` },
          { icon: User,        label: 'Patient ID',   value: `#${invoice.patientId}` },
          { icon: CalendarDays,label: 'Created',      value: formatDate(invoice.createdAt, 'MMM d, yyyy') },
          { icon: CalendarDays,label: 'Updated',      value: formatDate(invoice.updatedAt, 'MMM d, yyyy') },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-3.5 rounded-xl bg-navy-900/50 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={12} className="text-slate-600" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-sm font-medium text-white">{value || '—'}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {invoice.description && (
        <div className="p-4 rounded-xl bg-navy-900/50 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={12} className="text-slate-600" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{invoice.description}</p>
        </div>
      )}

      {/* Payment action */}
      {canPay && (
        <div className="flex justify-end pt-2">
          <button
            className="btn-primary"
            onClick={onPay}
            disabled={isPaying}
          >
            {isPaying ? <Spinner size={14} /> : <DollarSign size={15} />}
            {isPaying ? 'Processing…' : 'Mark as Paid'}
          </button>
        </div>
      )}
    </div>
  )
}
