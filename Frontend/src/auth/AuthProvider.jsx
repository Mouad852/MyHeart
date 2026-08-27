/**
 * AuthProvider.jsx — authentication state for the whole application.
 *
 * Responsibilities:
 *  - initialise Keycloak once, before anything renders
 *  - expose the current user, their roles, and login / logout
 *  - keep the access token fresh and mirrored into sessionStorage for axios
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import keycloak, {
  currentRoles,
  initKeycloak,
  refreshToken,
  storeToken,
} from './keycloak'
import { primaryRole } from './roles'
import { IS_DEMO } from '../demo/config'
import { useDemoAuth } from '../demo/useDemoAuth'

const AuthContext = createContext(null)

/** How often to check whether the access token needs refreshing. */
const REFRESH_INTERVAL_MS = 30_000

export function AuthProvider({ children }) {
  // In demo mode there is no Keycloak to initialise and no token to refresh.
  // The branch is at the top of the provider rather than threaded through it,
  // so every screen below keeps the same context shape and never learns which
  // build it is running in.
  if (IS_DEMO) return <DemoAuthProvider>{children}</DemoAuthProvider>

  return <KeycloakAuthProvider>{children}</KeycloakAuthProvider>
}

function DemoAuthProvider({ children }) {
  const value = useDemoAuth()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function KeycloakAuthProvider({ children }) {
  const [status, setStatus] = useState('initialising') // initialising | ready | failed
  const [authenticated, setAuthenticated] = useState(false)
  const [roles, setRoles] = useState([])
  const [error, setError] = useState(null)
  // React 18 StrictMode mounts effects twice in development; Keycloak throws if
  // init() runs more than once against the same instance.
  const initStarted = useRef(false)

  useEffect(() => {
    if (initStarted.current) return
    initStarted.current = true

    initKeycloak()
      .then((isAuthenticated) => {
        setAuthenticated(isAuthenticated)
        if (isAuthenticated) {
          storeToken(keycloak.token)
          setRoles(currentRoles())
        }
        setStatus('ready')
      })
      .catch((err) => {
        setError(err?.message || 'Could not reach the identity provider.')
        setStatus('failed')
      })
  }, [])

  // Keep the token fresh while the tab is open.
  useEffect(() => {
    if (!authenticated) return undefined

    const timer = setInterval(async () => {
      const ok = await refreshToken()
      if (!ok) {
        setAuthenticated(false)
        setRoles([])
      }
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [authenticated])

  const login = useCallback((returnTo) => {
    const target = returnTo || '/'
    return keycloak.login({
      redirectUri: `${window.location.origin}${target}`,
    })
  }, [])

  const logout = useCallback(() => {
    storeToken(null)
    return keycloak.logout({ redirectUri: `${window.location.origin}/login` })
  }, [])

  const hasRole = useCallback((role) => roles.includes(role), [roles])

  const hasAnyRole = useCallback(
    (allowed) => !allowed?.length || allowed.some((role) => roles.includes(role)),
    [roles]
  )

  const value = useMemo(
    () => ({
      status,
      authenticated,
      error,
      roles,
      role: primaryRole(roles),
      username: keycloak.tokenParsed?.preferred_username ?? null,
      fullName: keycloak.tokenParsed?.name ?? null,
      email: keycloak.tokenParsed?.email ?? null,
      // Set by the patientId / doctorId protocol mappers in the realm. Used to
      // scope a patient or doctor to their own records.
      patientId: keycloak.tokenParsed?.patientId ?? null,
      doctorId: keycloak.tokenParsed?.doctorId ?? null,
      login,
      logout,
      hasRole,
      hasAnyRole,
    }),
    [status, authenticated, error, roles, login, logout, hasRole, hasAnyRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
