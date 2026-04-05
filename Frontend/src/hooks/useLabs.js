/**
 * useLabs.js
 * ─────────────────────────────────────────────────────────────────
 * React Query hooks for the lab-service.
 * ─────────────────────────────────────────────────────────────────
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import labApi from '../services/labApi'

const KEYS = {
  allRequests:  ['lab-requests'],
  patient:      (patientId)  => ['lab-requests', 'patient',  patientId],
  results:      (requestId)  => ['lab-results',  'request',  requestId],
}

/** Fetch all lab requests for a patient */
export function useLabRequestsByPatient(patientId) {
  return useQuery({
    queryKey: KEYS.patient(patientId),
    queryFn:  () => labApi.getByPatient(patientId),
    enabled:  !!patientId,
  })
}

/** Fetch all lab requests globally (for the labs listing page) */
export function useAllLabRequests() {
  return useQuery({
    queryKey: KEYS.allRequests,
    queryFn:  labApi.getAllRequests,
  })
}

/** Fetch results for a specific lab request */
export function useLabResults(requestId) {
  return useQuery({
    queryKey: KEYS.results(requestId),
    queryFn:  () => labApi.getResultsByRequest(requestId),
    enabled:  !!requestId,
  })
}

/** Create a new lab request */
export function useCreateLabRequest(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: labApi.createLabRequest,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.allRequests })
      qc.invalidateQueries({ queryKey: KEYS.patient(data?.patientId) })
      toast.success('Lab request created')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create lab request')
      options.onError?.(err)
    },
  })
}

/** Submit a lab result for a request */
export function useCreateLabResult(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: labApi.createLabResult,
    onSuccess: (data) => {
      // Invalidate the results for the parent request + the global requests list
      // (status on the request may change to COMPLETED)
      qc.invalidateQueries({ queryKey: KEYS.results(data?.requestId) })
      qc.invalidateQueries({ queryKey: KEYS.allRequests })
      toast.success('Lab result submitted')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit lab result')
      options.onError?.(err)
    },
  })
}
