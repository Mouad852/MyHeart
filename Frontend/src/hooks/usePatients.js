/**
 * usePatients.js
 * ─────────────────────────────────────────────────────────────────
 * React Query hooks for patient data.
 * Centralises all server-state logic: caching, loading, error states,
 * and cache invalidation after mutations.
 * ─────────────────────────────────────────────────────────────────
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import patientApi from '../services/patientApi'

// Cache key — all patient queries share this namespace
const QUERY_KEY = ['patients']

/**
 * One page of patients, filtered server-side.
 *
 * @param {{ page?: number, size?: number, q?: string }} params
 */
export function usePatients(params = {}) {
  const { page = 0, size = 20, q = '' } = params
  return useQuery({
    queryKey: [...QUERY_KEY, 'page', page, size, q],
    queryFn: () => patientApi.getPage({ page, size, q }),
    // Keeps the previous page visible while the next one loads, so the table
    // does not collapse to a spinner on every page change.
    placeholderData: (previous) => previous,
  })
}

/** Every patient, for select boxes. */
export function usePatientOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: patientApi.getOptions,
    staleTime: 5 * 60 * 1000,
  })
}

/** Fetch a single patient by ID */
export function usePatient(id) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => patientApi.getById(id),
    enabled: !!id,
  })
}

/** Create a new patient */
export function useCreatePatient(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: patientApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Patient created successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create patient')
      options.onError?.(err)
    },
  })
}

/** Update an existing patient */
export function useUpdatePatient(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => patientApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Patient updated successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update patient')
      options.onError?.(err)
    },
  })
}

/** Delete a patient */
export function useDeletePatient(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: patientApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Patient deleted')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete patient')
    },
  })
}
