/**
 * useGatewayHealth.js — polls the API gateway's actuator health endpoint.
 *
 * Replaces the sidebar's previously hardcoded "All services operational"
 * label, which claimed a status nobody had checked.
 */
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../services/axiosInstance'

const POLL_INTERVAL_MS = 30_000

export function useGatewayHealth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['gateway-health'],
    queryFn: async () => {
      // /actuator/health is permitAll on the gateway, so this works even
      // before sign-in.
      const response = await axiosInstance.get('/actuator/health')
      return response.data
    },
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
    staleTime: POLL_INTERVAL_MS,
  })

  if (isLoading) {
    return { state: 'checking', label: 'Checking services' }
  }

  if (isError) {
    return { state: 'down', label: 'Gateway unreachable' }
  }

  if (data?.status === 'UP') {
    return { state: 'up', label: 'All services operational' }
  }

  return { state: 'degraded', label: 'Some services degraded' }
}
