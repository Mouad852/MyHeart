/**
 * axiosInstance.js
 * ─────────────────────────────────────────────────────────────────
 * Centralized Axios configuration.
 *
 * All API service files import from here, ensuring:
 *  - Consistent base URL across the app (reads from .env)
 *  - Unified error handling / response interception
 *  - Bearer token injection for the Keycloak-secured gateway
 * ─────────────────────────────────────────────────────────────────
 */
import axios from 'axios'
import { IS_DEMO } from '../demo/config'
import demoAdapter from '../demo/adapter'

export const TOKEN_STORAGE_KEY = 'access_token'

const axiosInstance = axios.create({
  // VITE_API_BASE_URL is defined in .env
  // In dev, Vite proxies /api → http://localhost:8080 (no CORS issues)
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000, // 15 second timeout

  // In demo mode there is no gateway to reach. The adapter is installed at the
  // point the network would be, so every service module, query and screen above
  // it runs unchanged and unaware. See src/demo/adapter.js.
  ...(IS_DEMO ? { adapter: demoAdapter } : {}),
})

// ── Request Interceptor (single) ────────────────────────────────
// Attaches the Keycloak access token to every outgoing request.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor (single) ───────────────────────────────
// Normalises error shapes AND handles auth failures.
//
// These must live in one handler. The previous version registered two response
// interceptors: the first rejected with a reshaped `{ message, status, data }`
// object, so the second one's `error.response.status` check never matched and
// the 401 handling silently never ran.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / timeout error (no response from server)
    if (!error.response) {
      return Promise.reject({
        message: 'Cannot reach the server. Is the API Gateway running?',
        status: 0,
      })
    }

    const { data, status } = error.response

    // Session expired or not authenticated → clear the token and bounce to login.
    // Guarded so we never redirect while already on /login.
    if (status === 401) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        const returnTo = encodeURIComponent(
          window.location.pathname + window.location.search
        )
        window.location.href = `/login?returnTo=${returnTo}`
      }
      return Promise.reject({
        message: 'Your session has expired. Please sign in again.',
        status,
        data,
      })
    }

    // Authenticated but not permitted. The gateway returns 403 for a valid user
    // lacking the required role — signing them out here would be a bug.
    if (status === 403) {
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        status,
        data,
      })
    }

    // Spring Boot GlobalExceptionHandler returns { message, error, status, ... }
    const message =
      data?.message || data?.error || `Request failed with status ${status}`

    return Promise.reject({ message, status, data })
  }
)

export default axiosInstance
