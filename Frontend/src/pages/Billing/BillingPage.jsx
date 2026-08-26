/**
 * BillingPage.jsx — the clinic's ledger.
 *
 * The screen used to open on an empty box reading "Select a patient", with a
 * dropdown above it. A billing clerk signing in to do a morning's work was
 * shown nothing at all until they had guessed which patient to look at — which
 * is exactly backwards, because the question they arrive with is *who owes us
 * money*, and no single patient answers it.
 *
 * So it opens on the whole ledger, ordered with the oldest debt first, with the
 * clinic's totals across the top and the patient filter demoted to what it
 * actually is: one filter among several.
 *
 * On presentation: this is money, so it is set in the identifier face, aligned
 * on the right of its column, and never abbreviated. Amber marks what is owed
 * and rose marks what is late; a paid invoice is written in plain grey, because
 * a settled invoice needs nothing from anybody and colour spent on it is colour
 * taken away from the two rows on the page that do.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote,
  Plus,
  ReceiptText,
  RotateCcw,
  Ban,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusBadge from '../../components/ui/StatusBadge'
import Segmented from '../../components/ui/Segmented'
import Menu from '../../components/ui/Menu'
import PageHeader from '../../components/ui/Page'
import { Panel } from '../../components/ui/Panel'
import { Skeleton, SkeletonText } from '../../components/ui/LoadingSpinner'
import InvoiceForm from './InvoiceForm'
import InvoiceDetails from './InvoiceDetails'
import {
  useAllInvoices,
  useBillingSummary,
  useCreateInvoice,
  useInvoiceTransition,
} from '../../hooks/useBilling'
import { usePatientOptions } from '../../hooks/usePatients'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'

/** An amount, written out in full. Rounding money hides the pennies owed. */
export function money(amount, currency) {
  const value = Number(amount ?? 0)
  if (!currency) return value.toFixed(2)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(value)
}

function on(value, pattern = 'd MMM yyyy') {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

/** The clinic's position, across the top. Four amounts, on one rule. */
function Ledger({ summary }) {
  const data = summary.data
  const currency = data?.currency

  const cells = [
    {
      label: 'Outstanding',
      value: money(data?.outstandingAmount, currency),
      note: `${data?.outstandingCount ?? 0} unpaid`,
      tone: 'text-amber-300',
    },
    {
      label: 'Overdue',
      value: money(data?.overdueAmount, currency),
      note: `${data?.overdueCount ?? 0} past due`,
      // Rose only when there is actually something late.
      tone: data?.overdueCount > 0 ? 'text-rose-300' : 'text-slate-500',
    },
    {
      label: 'Collected',
      value: money(data?.collectedAmount, currency),
      note: `${data?.collectedCount ?? 0} settled`,
      tone: 'text-white',
    },
    {
      label: 'Invoices raised',
      value: String(data?.invoiceCount ?? 0),
      note: 'since the clinic opened',
      tone: 'text-white',
    },
  ]

  return (
    <dl className="grid grid-cols-1 border-y border-hairline sm:grid-cols-2 lg:grid-cols-4">
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={`px-4 py-4 first:pl-0 sm:px-5 sm:first:pl-0
                      ${index % 2 !== 0 ? 'sm:border-l sm:border-hairline' : ''}
                      ${index !== 0 ? 'lg:border-l lg:border-hairline' : 'lg:border-l-0'}
                      ${index < cells.length - 1 ? 'border-b border-hairline sm:border-b-0' : ''}`}
        >
          <dt className="text-meta text-slate-500">{cell.label}</dt>
          <dd className={`ident mt-1.5 text-xl font-semibold ${cell.tone}`}>
            {summary.isLoading ? <Skeleton className="h-6 w-28" /> : cell.value}
          </dd>
          <p className="mt-1 text-meta text-slate-500">{cell.note}</p>
        </div>
      ))}
    </dl>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   The page
   ───────────────────────────────────────────────────────────────────────── */

export default function BillingPage() {
  const { hasAnyRole } = useAuth()
  const invoices = useAllInvoices()
  const summary = useBillingSummary()

  // A billing clerk cannot read the register — the gateway serves /patients to
  // ADMIN, DOCTOR, RECEPTIONIST and NURSE only — so the names are asked for
  // just by the roles that will get them, and the rest see the patient number.
  const canReadPatients = hasAnyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE])
  const patientOptions = usePatientOptions({ enabled: canReadPatients })

  const namesById = useMemo(() => {
    const map = new Map()
    for (const patient of patientOptions.data ?? []) map.set(patient.id, patient.name)
    return map
  }, [patientOptions.data])

  const [scope, setScope] = useState('outstanding')
  const [patientFilter, setPatientFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [confirming, setConfirming] = useState(null) // { invoice, action }

  const createMutation = useCreateInvoice({ onSuccess: () => setCreateOpen(false) })
  const transition = useInvoiceTransition({
    onSuccess: () => {
      setConfirming(null)
      setViewing(null)
    },
  })

  const all = useMemo(() => invoices.data ?? [], [invoices.data])

  const scopes = useMemo(() => {
    const test = {
      outstanding: (invoice) => invoice.status === 'ISSUED',
      overdue: (invoice) => invoice.overdue,
      paid: (invoice) => invoice.status === 'PAID',
      closed: (invoice) => ['VOID', 'REFUNDED'].includes(invoice.status),
      all: () => true,
    }
    return {
      test,
      counts: Object.fromEntries(
        Object.entries(test).map(([key, fn]) => [key, all.filter(fn).length])
      ),
    }
  }, [all])

  const rows = useMemo(() => {
    let list = all.filter(scopes.test[scope])
    if (patientFilter) list = list.filter((i) => String(i.patientId) === String(patientFilter))

    // Oldest debt first while looking at money owed, because that is the one
    // somebody has to chase; most recent first everywhere else.
    const owed = scope === 'outstanding' || scope === 'overdue'
    return list.sort((a, b) => {
      const left = Date.parse(owed ? (a.dueDate ?? a.createdAt) : a.createdAt) || 0
      const right = Date.parse(owed ? (b.dueDate ?? b.createdAt) : b.createdAt) || 0
      return owed ? left - right : right - left
    })
  }, [all, scope, patientFilter, scopes])

  const patientName = (invoice) =>
    namesById.get(invoice.patientId) || `Patient ${invoice.patientId}`

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        description="Every invoice the clinic has raised, with what is owed and what is late."
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            New invoice
          </button>
        }
        meta={<Ledger summary={summary} />}
      />

      {summary.isError && (
        <ErrorBanner
          className="mb-6"
          variant="degraded"
          title="The clinic totals are unavailable"
          message="The figures above could not be calculated. The invoice list below is unaffected."
          onRetry={summary.refetch}
        />
      )}

      {invoices.isError && (
        <ErrorBanner
          className="mb-6"
          title="Invoices could not be loaded"
          message={invoices.error?.message}
          onRetry={invoices.refetch}
        />
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-hairline px-3">
          <Segmented
            label="Which invoices to show"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'outstanding', label: 'Outstanding', count: scopes.counts.outstanding },
              { value: 'overdue', label: 'Overdue', count: scopes.counts.overdue },
              { value: 'paid', label: 'Paid', count: scopes.counts.paid },
              { value: 'closed', label: 'Closed', count: scopes.counts.closed },
              { value: 'all', label: 'All', count: scopes.counts.all },
            ]}
          />

          {canReadPatients && (
            <div className="mb-2 w-full max-w-[15rem] sm:mb-0">
              <label className="sr-only" htmlFor="billing-patient-filter">
                Filter by patient
              </label>
              <select
                id="billing-patient-filter"
                className="select h-8 py-0 text-meta"
                value={patientFilter}
                onChange={(event) => setPatientFilter(event.target.value)}
              >
                <option value="">Every patient</option>
                {(patientOptions.data ?? []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {invoices.isLoading && (
          <div className="divide-y divide-hairline" aria-busy="true">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-6 px-5 py-3.5">
                <SkeletonText chars={9} />
                <SkeletonText chars={18} className="flex-1" />
                <SkeletonText chars={12} />
              </div>
            ))}
          </div>
        )}

        {!invoices.isLoading && rows.length === 0 && (
          <EmptyState
            tone={scope === 'overdue' || scope === 'outstanding' ? 'good' : 'nothing-yet'}
            icon={ReceiptText}
            title={
              scope === 'overdue'
                ? 'Nothing is overdue.'
                : scope === 'outstanding'
                  ? 'Nothing is outstanding.'
                  : 'No invoices here'
            }
            description={
              scope === 'overdue'
                ? 'Every issued invoice is still within its due date.'
                : scope === 'outstanding'
                  ? 'Every invoice the clinic has raised has been settled or closed.'
                  : 'Invoices raised for appointments and services appear here.'
            }
          />
        )}

        {!invoices.isLoading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th pl-5">Invoice</th>
                  <th className="th hidden sm:table-cell">Patient</th>
                  <th className="th hidden whitespace-nowrap lg:table-cell">Due</th>
                  <th className="th">Status</th>
                  <th className="th hidden text-right sm:table-cell">Amount</th>
                  <th className="th pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((invoice) => {
                  const allowed = invoice.allowedTransitions || []
                  return (
                    <tr key={invoice.id} className="row-hover">
                      <td className="td pl-5">
                        <button
                          type="button"
                          onClick={() => setViewing(invoice)}
                          className="rounded text-left"
                        >
                          <span className="ident block font-medium text-white">
                            INV-{String(invoice.id).padStart(5, '0')}
                          </span>
                          {/* On a phone the amount folds into this cell and
                              the description gives way to it: the sum owed is
                              the reason anybody opened the ledger. */}
                          <span className="ident mt-0.5 block text-meta text-slate-300 sm:hidden">
                            {money(invoice.amount, invoice.currency)}
                          </span>
                          <span className="mt-0.5 hidden max-w-[26ch] truncate text-meta text-slate-500 sm:block">
                            {invoice.description || on(invoice.createdAt)}
                          </span>
                        </button>
                      </td>

                      <td className="td hidden whitespace-nowrap sm:table-cell">
                        {canReadPatients ? (
                          <Link
                            to={`/patients/${invoice.patientId}`}
                            className="rounded text-slate-300 underline-offset-4 hover:text-white hover:underline"
                          >
                            {patientName(invoice)}
                          </Link>
                        ) : (
                          <span className="ident text-slate-400">
                            Patient {invoice.patientId}
                          </span>
                        )}
                      </td>

                      <td className="td hidden whitespace-nowrap lg:table-cell">
                        {invoice.dueDate ? (
                          <span
                            className={`ident text-meta ${
                              invoice.overdue ? 'text-rose-300' : 'text-slate-500'
                            }`}
                          >
                            {on(invoice.dueDate)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="td">
                        <StatusBadge
                          size="sm"
                          status={invoice.overdue ? 'OVERDUE' : invoice.status}
                        />
                      </td>

                      {/* Right-aligned: a column of money is read by comparing
                          magnitudes, and that only works from the units up. */}
                      <td className="td ident hidden text-right font-medium text-white sm:table-cell">
                        {money(invoice.amount, invoice.currency)}
                      </td>

                      <td className="td pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hidden on a phone, where it is reached through
                              the row menu instead. Four columns and a labelled
                              button do not fit in 375px without the table
                              scrolling sideways under the reader's thumb. */}
                          {allowed.includes('PAID') && (
                            <button
                              type="button"
                              disabled={transition.isPending}
                              onClick={() =>
                                transition.mutate({ id: invoice.id, action: 'pay' })
                              }
                              className="btn-row hidden whitespace-nowrap lg:inline-flex"
                            >
                              <Banknote size={12} strokeWidth={2} aria-hidden="true" />
                              Mark paid
                            </button>
                          )}
                          <Menu
                            label={`Actions for invoice ${invoice.id}`}
                            items={[
                              {
                                label: 'View invoice',
                                icon: ReceiptText,
                                onSelect: () => setViewing(invoice),
                              },
                              allowed.includes('PAID') && {
                                label: 'Mark as paid',
                                icon: Banknote,
                                onSelect: () =>
                                  transition.mutate({ id: invoice.id, action: 'pay' }),
                              },
                              allowed.includes('REFUNDED') && {
                                label: 'Refund',
                                icon: RotateCcw,
                                onSelect: () =>
                                  setConfirming({ invoice, action: 'refund' }),
                              },
                              allowed.includes('VOID') && {
                                label: 'Void invoice',
                                icon: Ban,
                                danger: true,
                                onSelect: () => setConfirming({ invoice, action: 'void' }),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Raise an invoice"
      >
        <InvoiceForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `INV-${String(viewing.id).padStart(5, '0')}` : ''}
        description={viewing ? patientName(viewing) : undefined}
      >
        <InvoiceDetails
          invoice={viewing}
          patientName={viewing ? patientName(viewing) : null}
          onTransition={(action) => transition.mutate({ id: viewing.id, action })}
          isPending={transition.isPending}
        />
      </Modal>

      {/* Both of these move money and neither can be undone, so both are
          confirmed by name and amount rather than by "Are you sure?". */}
      <ConfirmDialog
        isOpen={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={() =>
          transition.mutate({ id: confirming.invoice.id, action: confirming.action })
        }
        isLoading={transition.isPending}
        busyLabel={confirming?.action === 'refund' ? 'Refunding…' : 'Voiding…'}
        title={confirming?.action === 'refund' ? 'Refund this invoice?' : 'Void this invoice?'}
        message={
          confirming
            ? `${money(confirming.invoice.amount, confirming.invoice.currency)} on INV-${String(
                confirming.invoice.id
              ).padStart(5, '0')} for ${patientName(confirming.invoice)} will be ${
                confirming.action === 'refund'
                  ? 'returned to the patient. The invoice moves to refunded and cannot be paid again.'
                  : 'written off. The invoice moves to void and cannot be paid or refunded afterwards.'
              }`
            : ''
        }
        confirmLabel={confirming?.action === 'refund' ? 'Refund it' : 'Void it'}
      />
    </>
  )
}
