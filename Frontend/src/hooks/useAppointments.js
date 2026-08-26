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

/**
 * The signed-in doctor's calendar for one day.
 * @param {string} day ISO date, for example 2026-08-27
 */
export function useMyDay(day) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'my-day', day],
    queryFn: () => appointmentApi.myDay(day),
    // Keep the previous day on screen while the next loads.
    placeholderData: (previous) => previous,
  })
}

/**
 * Move an appointment to another lifecycle state.
 *
 * The server decides which transitions are legal and returns them on every
 * appointment, so the UI offers only those and never has to guess.
 */
export function useAppointmentTransition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }) => {
      if (action === 'complete') return appointmentApi.complete(id)
      if (action === 'confirm') return appointmentApi.confirm(id)
      if (action === 'no-show') return appointmentApi.markNoShow(id, reason)
      return appointmentApi.cancel(id, reason)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      const said = {
        complete: 'Marked as completed',
        confirm: 'Appointment confirmed',
        'no-show': 'Marked as a no-show',
      }
      toast.success(said[variables.action] || 'Appointment cancelled')
    },
    onError: (err) => {
      toast.error(err.message || 'Could not update the appointment')
    },
  })
}
