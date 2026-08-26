/**
 * InvoiceDetails.jsx — one invoice, in full.
 *
 * Laid out as a document rather than as a grid of small boxes. The amount and
 * its state lead, because those are the two facts anybody opens an invoice to
 * check; the reference numbers and dates follow as labelled fields on
 * hairlines; and the actions the server will accept are at the foot, where the
 * signature would be.
 *
 * The four bordered tiles this replaced held one short value each — an id, a
 * patient number and two dates — and spent four borders, four icons and four
 * uppercase labels to say them.
 */
import { Banknote, RotateCcw, Ban } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/LoadingSpinner'
import { Field } from '../../components/ui/Panel'
import { formatDate } from '../../utils'
import { money } from './BillingPage'

export default function InvoiceDetails({ invoice, patientName, onTransition, isPending }) {
  if (!invoice) return null

  const allowed = invoice.allowedTransitions || []

  return (
    <div>
      {/* The amount, set at the size the amount deserves. */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="section-label">Amount</p>
          <p className="ident mt-2 text-figure-lg font-semibold text-ink">
            {money(invoice.amount, invoice.currency)}
          </p>
        </div>
        <StatusBadge status={invoice.overdue ? 'OVERDUE' : invoice.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-5">
        <Field label="Reference" mono>
          INV-{String(invoice.id).padStart(5, '0')}
        </Field>
        <Field label="Patient">
          {patientName || `Patient ${invoice.patientId}`}
        </Field>
        <Field label="Raised" mono>
          {formatDate(invoice.createdAt, 'd MMM yyyy')}
        </Field>
        <Field label="Due" mono>
          {invoice.dueDate ? (
            <span className={invoice.overdue ? 'text-critical' : undefined}>
              {formatDate(invoice.dueDate, 'd MMM yyyy')}
            </span>
          ) : null}
        </Field>
        {invoice.paidAt && (
          <Field label="Settled" mono>
            {formatDate(invoice.paidAt, 'd MMM yyyy')}
          </Field>
        )}
        {invoice.appointmentId && (
          <Field label="Appointment" mono>
            {String(invoice.appointmentId)}
          </Field>
        )}
        {invoice.serviceCode && <Field label="Service">{invoice.serviceCode}</Field>}
      </dl>

      {invoice.description && (
        <div className="border-t border-rule py-5">
          <p className="section-label">For</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{invoice.description}</p>
        </div>
      )}

      {/* Recorded when the invoice was closed, and worth surfacing: it is the
          only explanation of why money stopped being expected. */}
      {invoice.voidReason && (
        <div className="border-t border-rule py-5">
          <p className="section-label">Reason</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{invoice.voidReason}</p>
        </div>
      )}

      {(allowed.includes('PAID') || allowed.includes('REFUNDED') || allowed.includes('VOID')) && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-rule pt-5">
          {allowed.includes('VOID') && (
            <button
              type="button"
              className="btn-secondary"
              disabled={isPending}
              onClick={() => onTransition('void')}
            >
              <Ban size={13} strokeWidth={2} aria-hidden="true" />
              Void
            </button>
          )}
          {allowed.includes('REFUNDED') && (
            <button
              type="button"
              className="btn-secondary"
              disabled={isPending}
              onClick={() => onTransition('refund')}
            >
              <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
              Refund
            </button>
          )}
          {allowed.includes('PAID') && (
            <button
              type="button"
              className="btn-primary"
              disabled={isPending}
              onClick={() => onTransition('pay')}
            >
              {isPending ? (
                <Spinner size={13} />
              ) : (
                <Banknote size={13} strokeWidth={2} aria-hidden="true" />
              )}
              Mark as paid
            </button>
          )}
        </div>
      )}
    </div>
  )
}
