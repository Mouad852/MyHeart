/**
 * useDemoAuth.js — the auth context, without an identity provider.
 *
 * Produces exactly the shape AuthProvider produces against Keycloak: the same
 * keys, the same roles array, the same patientId and doctorId claims. Nothing
 * below the provider can tell the difference, which is the point — the demo has
 * to exercise the real components, not a parallel set written for it.
 *
 * `login()` takes an account rather than redirecting, because there is nowhere
 * to redirect to. The login page passes one when a demo account is chosen.
 */
import { useCallback, useMemo, useState } from 'react'
import { primaryRole } from '../auth/roles'
import { currentAccount, signIn, signOut } from './store'

export function useDemoAuth() {
  const [account, setAccount] = useState(() => currentAccount())

  const login = useCallback((usernameOrReturnTo) => {
    // The real login() takes a returnTo and redirects to Keycloak. Here a
    // username is expected; anything else means the caller wanted the identity
    // provider, and there isn't one.
    const next = signIn(usernameOrReturnTo)
    if (next) setAccount(next)
    return next
  }, [])

  const logout = useCallback(() => {
    signOut()
    setAccount(null)
    window.location.assign('/login')
  }, [])

  const roles = useMemo(() => (account ? [account.role] : []), [account])

  const hasRole = useCallback((role) => roles.includes(role), [roles])
  const hasAnyRole = useCallback(
    (allowed) => !allowed?.length || allowed.some((role) => roles.includes(role)),
    [roles]
  )

  return useMemo(
    () => ({
      status: 'ready',
      authenticated: Boolean(account),
      error: null,
      roles,
      role: primaryRole(roles),
      username: account?.username ?? null,
      fullName: account?.name ?? null,
      email: account ? `${account.username}@medcore.local` : null,
      patientId: account?.patientId ?? null,
      doctorId: account?.doctorId ?? null,
      login,
      logout,
      hasRole,
      hasAnyRole,
      // Only demo builds carry this. The demo bar uses it to switch account
      // without a round trip through the login page.
      demo: { account, signInAs: login },
    }),
    [account, roles, login, logout, hasRole, hasAnyRole]
  )
}
