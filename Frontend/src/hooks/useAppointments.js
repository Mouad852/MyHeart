import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import appointmentApi from '../services/appointmentApi'

const QUERY_KEY = ['appointments']

export function useAppointments() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: appointmentApi.getAll,
  })
}

export function useAppointment(id) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => appointmentApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateAppointment(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: appointmentApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Appointment scheduled successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to schedule appointment')
      options.onError?.(err)
    },
  })
}

export function useCancelAppointment(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: appointmentApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Appointment cancelled')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel appointment')
    },
  })
}
