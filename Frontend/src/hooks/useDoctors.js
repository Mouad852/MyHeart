import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import doctorApi from '../services/doctorApi'

const QUERY_KEY = ['doctors']

export function useDoctors() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: doctorApi.getAll,
  })
}

export function useDoctor(id) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => doctorApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateDoctor(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: doctorApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Doctor created successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create doctor')
      options.onError?.(err)
    },
  })
}

export function useUpdateDoctor(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => doctorApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Doctor updated successfully')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update doctor')
      options.onError?.(err)
    },
  })
}

export function useDeleteDoctor(options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: doctorApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Doctor deleted')
      options.onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete doctor')
    },
  })
}
