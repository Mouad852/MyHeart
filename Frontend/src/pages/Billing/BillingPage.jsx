/**
 * BillingPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Billing management page.
 *
 * Features:
 *  - Filter invoices by patient (dropdown selector)
 *  - Create invoice (modal)
 *  - View invoice details + pay (modal)
 *  - Status badges: PENDING / PAID / CANCELLED / OVERDUE
 *  - Loading / empty / error states
 * ─────────────────────────────────────────────────────────────────
 */
import { useState } from 'react'
import {
  ReceiptText, Plus, Eye, DollarSign
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import PatientSelector from '../../components/ui/PatientSelector'
import { PageSpinner } from '../../components/ui/LoadingSpinner'
import InvoiceForm from './InvoiceForm'
import InvoiceDetails from './InvoiceDetails'
import {
  usePatientInvoices,
  useCreateInvoice,
  usePayInvoice,
} from '../../hooks/useBilling'
import { formatDate } from '../../utils'

export default function BillingPage() {
  const [patientId, setPatientId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null) // invoice object for detail modal

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch,
  } = usePatientInvoices(patientId)

  const createMutation = useCreateInvoice({ onSuccess: () => setCreateOpen(false) })
  const payMutation = usePayInvoice({
    onSuccess: () => setSelectedInvoice(null),
  })

  // Summary stats (derived from fetched invoices)
  const totalAmount = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const paidCount = invoices.filter((i) => i.status === 'PAID').length
  const pendingCount = invoices.filter((i) => i.status === 'PENDING').length

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Billing</h2>
          <p className="text-muted mt-1">Manage patient invoices and payments</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {/* ── Patient filter ───────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-sm">
            <PatientSelector
              value={patientId}
              onChange={setPatientId}
              label="Filter by Patient"
              placeholder="Choose a patient to view invoices…"
            />
          </div>
          {patientId && invoices.length > 0 && (
            <div className="flex items-center gap-6 pb-0.5">
              <Stat label="Total" value={`$${totalAmount.toFixed(2)}`} />
              <Stat label="Paid" value={paidCount} accent="teal" />
              <Stat label="Pending" value={pendingCount} accent="amber" />
            </div>
          )}
        </div>
      </div>

      {/* ── Invoices table ───────────────────────────────────── */}
      <div className="card overflow-hidden">

        {!patientId && (
          <EmptyState
            icon={ReceiptText}
            title="Select a patient"
            description="Choose a patient above to view and manage their invoices."
          />
        )}

        {patientId && isLoading && <PageSpinner />}

        {patientId && !isLoading && invoices.length === 0 && !error && (
          <EmptyState
            icon={ReceiptText}
            title="No invoices found"
            description="This patient has no invoices yet."
            action={
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus size={15} /> Create First Invoice
              </button>
            }
          />
        )}

        {patientId && !isLoading && invoices.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Invoice', 'Amount', 'Status', 'Created', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest
                                ${h === 'Actions' ? 'text-right' : 'text-left'}
                                ${h === 'Created' ? 'hidden lg:table-cell' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="table-row animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  {/* Invoice ID */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20
                                      flex items-center justify-center flex-shrink-0">
                        <ReceiptText size={14} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          INV-{String(inv.id).padStart(5, '0')}
                        </p>
                        {inv.description && (
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">
                            {inv.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">
                      ${Number(inv.amount ?? 0).toFixed(2)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={inv.status} />
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4 text-slate-500 text-xs hidden lg:table-cell">
                    {formatDate(inv.createdAt, 'MMM d, yyyy')}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-icon"
                        title="View details"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <Eye size={14} />
                      </button>
                      {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                        <button
                          className="btn-primary py-1.5 px-3 text-xs"
                          title="Pay now"
                          onClick={() => payMutation.mutate(inv.id)}
                          disabled={payMutation.isPending}
                        >
                          <DollarSign size={13} />
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Invoice Modal ─────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Invoice"
      >
        <InvoiceForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* ── Invoice Details Modal ────────────────────────────── */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Invoice INV-${String(selectedInvoice?.id ?? '').padStart(5, '0')}`}
      >
        <InvoiceDetails
          invoice={selectedInvoice}
          onPay={() => payMutation.mutate(selectedInvoice?.id)}
          isPaying={payMutation.isPending}
        />
      </Modal>
    </div>
  )
}

/** Small inline stat for the filter bar */
function Stat({ label, value, accent = 'slate' }) {
  const colors = {
    teal: 'text-teal-400',
    amber: 'text-amber-400',
    slate: 'text-white',
  }
  return (
    <div className="text-center">
      <p className={`font-display text-xl font-bold ${colors[accent] || colors.slate}`}>{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
    </div>
  )
}
