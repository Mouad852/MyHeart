/**
 * usePrescriptions.js
 * ─────────────────────────────────────────────────────────────────
 * React Query hooks for the prescription-service.
 * ─────────────────────────────────────────────────────────────────
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import prescriptionApi from '../services/prescriptionApi'

const KEYS = {
  all:     ['prescriptions'],
  patient: (patientId) => ['prescriptions', 'patient', patientId],
  doctor:  (doctorId)  => ['prescriptions', 'doctor',  doctorId],
  detail:  (id)        => ['prescriptions', 'detail',  id],
}

/** Fetch all prescriptions for a patient */
export function usePrescriptionsByPatient(patientId) {
  return useQuery({
    queryKey: KEYS.patient(patientId),
    queryFn:  () => prescriptionApi.getByPatient(patientId),
    enabled:  !!patientId,
  })
}

/** Fetch all prescriptions issued by a doctor */
export function usePrescriptionsByDoctor(doctorId) {
  return useQuery({
    queryKey: KEYS.doctor(doctorId),
    queryFn:  () => prescriptionApi.getByDoctor(doctorId),
    enabled:  !!doctorId,
  })
}

/** Fetch a single prescription by ID */
export function usePrescription(id) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => prescriptionApi.getPrescriptionById(id),
    enabled:  !!id,
  })
}

/** Fetch all prescriptions (for the global listing page) */
export function useAllPrescriptions() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn:  prescriptionApi.getAll,
  })
}

/** Create a new prescription */
/**
 * Download a prescription as a PDF.
 *
 * A saved file rather than a new tab: opening one from an async continuation is
 * what popup blockers exist to stop, and a doctor who wants to print this needs
 * it on disk anyway. The object URL is revoked straight after, so a session
 * spent printing does not accumulate blobs in memory.
 */
export function usePrescriptionDocument() {
  return useMutation({
    mutationFn: (id) => prescriptionApi.getDocument(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `prescription-${String(id).padStart(5, '0')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
    onError: (err) => {
      toast.error(err.message || 'Could not produce the prescription document')
    },
  })
}

export function useCreatePrescription(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: prescriptionApi.createPrescription,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: KEYS.patient(data?.patientId) })
      qc.invalidateQueries({ queryKey: KEYS.doctor(data?.doctorId) })
      toast.success('Prescription created successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create prescription')
      options.onError?.(err)
    },
  })
}
