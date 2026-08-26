/**
 * keycloak.js — the Keycloak client singleton.
 *
 * Authorization Code Flow with PKCE (S256). Credentials are entered on
 * Keycloak's own login screen, never in this application, so no password ever
 * touches our code.
 *
 * The access token is mirrored into sessionStorage under TOKEN_STORAGE_KEY
 * because axiosInstance reads it from there on every request. sessionStorage
 * (not localStorage) means the token dies with the browser tab.
 */
import Keycloak from 'keycloak-js'
import { TOKEN_STORAGE_KEY } from '../services/axiosInstance'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8480',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'myheart',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'myheart-frontend',
})

/** Seconds of remaining validity below which the token is refreshed. */
const MIN_TOKEN_VALIDITY = 60

export function storeToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

/**
 * Initialise against an existing Keycloak session without forcing a redirect.
 * `check-sso` lets an unauthenticated visitor reach /login normally instead of
 * being bounced straight to Keycloak.
 */
export function initKeycloak() {
  return keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    checkLoginIframe: false,
  })
}

/** Refresh the access token when it is close to expiring. */
export async function refreshToken() {
  try {
    const refreshed = await keycloak.updateToken(MIN_TOKEN_VALIDITY)
    if (refreshed) {
      storeToken(keycloak.token)
    }
    return true
  } catch {
    storeToken(null)
    return false
  }
}

/** Realm roles from the token, which is what the gateway authorises against. */
export function currentRoles() {
  return keycloak.tokenParsed?.realm_access?.roles ?? []
}

export default keycloak
