/**
 * axiosInstance.js
 * ─────────────────────────────────────────────────────────────────
 * Centralized Axios configuration.
 *
 * All API service files import from here, ensuring:
 *  - Consistent base URL across the app (reads from .env)
 *  - Unified error handling / response interception
 *  - Easy to swap base URL for prod vs dev
 * ─────────────────────────────────────────────────────────────────
 */
import axios from 'axios'

const axiosInstance = axios.create({
  // VITE_API_BASE_URL is defined in .env
  // In dev, Vite proxies /api → http://localhost:8080 (no CORS issues)
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15_000, // 15 second timeout
})

// ── Request Interceptor ─────────────────────────────────────────
// Useful place to inject auth tokens in the future
axiosInstance.interceptors.request.use(
  (config) => {
    // Example: const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ────────────────────────────────────────
// Normalise error shapes from the Spring Boot GlobalExceptionHandler
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

    // Server returned an error response
    const { data, status } = error.response

    // Spring Boot GlobalExceptionHandler returns { message, error, status, ... }
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${status}`

    return Promise.reject({ message, status, data })
  }
)

// Request interceptor to inject access_token from sessionStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance
