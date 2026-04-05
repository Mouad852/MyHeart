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
