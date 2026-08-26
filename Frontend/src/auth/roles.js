/**
 * roles.js — Single source of truth for role names and what each role may reach.
 *
 * These strings must match the realm roles in
 * Backend/keycloak/realm-export.json exactly. The gateway enforces the real
 * rules; anything here is a usability layer so people are not shown doors that
 * will not open for them.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  RECEPTIONIST: 'RECEPTIONIST',
  BILLING: 'BILLING',
  NURSE: 'NURSE',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
}

/**
 * Where each role lands after signing in. A patient has no business on the
 * staff dashboard, so sending everyone to "/" produces a dead end for them.
 */
export const ROLE_HOME = {
  [ROLES.PATIENT]: '/my-health',
}

/** The home route for a set of roles, defaulting to the staff dashboard. */
export function homeRouteFor(roles = []) {
  const primary = primaryRole(roles)
  return ROLE_HOME[primary] ?? '/'
}

/**
 * Which roles may see each route, mirroring the gateway's SecurityConfig.
 * A route absent from this map is treated as authenticated-only.
 */
export const ROUTE_ROLES = {
  '/': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.BILLING, ROLES.NURSE],
  '/patients': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE],
  '/doctors': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  '/appointments': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  '/billing': [ROLES.ADMIN, ROLES.BILLING, ROLES.RECEPTIONIST],
  '/prescriptions': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  '/labs': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  '/my-health': [ROLES.PATIENT],
}

/** Human-readable label for a role, for headers and badges. */
export function roleLabel(role) {
  switch (role) {
    case ROLES.ADMIN:
      return 'Administrator'
    case ROLES.DOCTOR:
      return 'Doctor'
    case ROLES.PATIENT:
      return 'Patient'
    case ROLES.RECEPTIONIST:
      return 'Receptionist'
    case ROLES.BILLING:
      return 'Billing'
    case ROLES.NURSE:
      return 'Nurse'
    case ROLES.LAB_TECHNICIAN:
      return 'Lab technician'
    default:
      return role
  }
}

/**
 * The role that decides which workspace someone lands in, when a user carries
 * more than one. Ordered by breadth of access.
 */
const PRIMARY_ROLE_ORDER = [
  ROLES.ADMIN,
  ROLES.DOCTOR,
  ROLES.RECEPTIONIST,
  ROLES.BILLING,
  ROLES.NURSE,
  ROLES.LAB_TECHNICIAN,
  ROLES.PATIENT,
]

export function primaryRole(roles = []) {
  return PRIMARY_ROLE_ORDER.find((role) => roles.includes(role)) ?? null
}
