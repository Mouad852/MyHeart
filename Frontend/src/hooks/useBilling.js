/**
 * useBilling.js
 * ─────────────────────────────────────────────────────────────────
 * React Query hooks for the billing-service.
 * Follows the exact same pattern as usePatients / useDoctors.
 * ─────────────────────────────────────────────────────────────────
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import billingApi from '../services/billingApi'

// Cache key namespace
const KEYS = {
  all:     ['invoices'],
  patient: (patientId) => ['invoices', 'patient', patientId],
  detail:  (id)        => ['invoices', 'detail',  id],
  summary: ['invoices', 'summary'],
}

/** Fetch a single invoice by ID */
export function useInvoice(id) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => billingApi.getInvoiceById(id),
    enabled:  !!id,
  })
}

/** Fetch all invoices for a patient */
export function usePatientInvoices(patientId) {
  return useQuery({
    queryKey: KEYS.patient(patientId),
    queryFn:  () => billingApi.getInvoicesByPatient(patientId),
    enabled:  !!patientId,
  })
}

/** Fetch ALL invoices (for the global billing dashboard view) */
export function useAllInvoices() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn:  billingApi.getAllInvoices,
  })
}

/**
 * Clinic-wide invoice totals.
 *
 * @param {{ enabled?: boolean }} options pass enabled:false for roles the
 *        gateway will refuse, so the screen does not fire a request it knows
 *        will come back 403.
 */
export function useBillingSummary({ enabled = true } = {}) {
  return useQuery({
    queryKey: KEYS.summary,
    queryFn: billingApi.getSummary,
    enabled,
    staleTime: 30 * 1000,
  })
}

/** Create a new invoice */
export function useCreateInvoice(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: (data) => {
      // Invalidate both the all-invoices list and this patient's list
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: KEYS.patient(data?.patientId) })
      toast.success('Invoice created successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create invoice')
      options.onError?.(err)
    },
  })
}

/**
 * Move an invoice to another state.
 *
 * One hook for pay, void and refund, because the three are the same operation
 * from the screen's point of view: the server publishes which of them this
 * invoice will accept, and the UI offers exactly those.
 */
export function useInvoiceTransition(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }) => {
      if (action === 'void') return billingApi.voidInvoice(id, reason)
      if (action === 'refund') return billingApi.refundInvoice(id, reason)
      return billingApi.payInvoice(id)
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: KEYS.summary })
      qc.invalidateQueries({ queryKey: KEYS.patient(data?.patientId) })
      // The overview and the patient timeline both read invoices.
      qc.invalidateQueries({ queryKey: ['overview'] })
      qc.invalidateQueries({ queryKey: ['timeline'] })
      const said = {
        void: 'Invoice voided',
        refund: 'Invoice refunded',
        pay: 'Invoice marked as paid',
      }
      toast.success(said[variables.action] || 'Invoice updated')
      options.onSuccess?.(data)
    },
    onError: (err) => {
      toast.error(err.message || 'The invoice could not be updated')
    },
  })
}

/** Mark invoice as PAID */
export function usePayInvoice(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: billingApi.payInvoice,
    onSuccess: () => {
      // Invalidate broadly — we don't know which patient list to target
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('Invoice marked as paid')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to process payment')
    },
  })
}
