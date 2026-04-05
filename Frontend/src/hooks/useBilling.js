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
