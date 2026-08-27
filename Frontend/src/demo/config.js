/**
 * config.js — is this build the demo, and who can sign into it.
 *
 * Demo mode exists because the real MedCore is sixteen containers, and nobody
 * evaluating a portfolio is going to start sixteen containers. The front end is
 * a static build, so it can be hosted permanently for nothing — but only if it
 * can answer its own requests.
 *
 * Nothing here is a security boundary and nothing here pretends to be one. In
 * demo mode there is no server, so there is nothing to defend: every rule the
 * real system enforces at the gateway and again in each service is *reproduced*
 * here so the screens behave honestly, not *enforced* here. The distinction is
 * stated in the interface too, so nobody mistakes the demo for the system.
 */

/**
 * Set at build time. The demo store and adapter are only reachable when this
 * is true, so a normal build never routes a request through them.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

/**
 * The accounts the login page offers, matching the realm export one for one —
 * same usernames, same roles, same patientId / doctorId claims. A demo that
 * signs you in as somebody the real system does not have is a demo of a
 * different product.
 *
 * NURSE and BILLING have route rules in roles.js and no Keycloak user, so the
 * real deployment has never rendered their screens. They are offered here,
 * which makes this the first place either has been looked at.
 */
export const DEMO_ACCOUNTS = [
  {
    username: 'admin.demo',
    name: 'Nawal Amrani',
    role: 'ADMIN',
    label: 'Administrator',
    summary: 'Everything',
  },
  {
    username: 'doctor.demo',
    name: 'John Smith',
    role: 'DOCTOR',
    label: 'Doctor',
    summary: 'The day, records, prescribing',
    doctorId: 2,
  },
  {
    username: 'reception.demo',
    name: 'Rania Reception',
    role: 'RECEPTIONIST',
    label: 'Receptionist',
    summary: 'Scheduling and the register',
  },
  {
    username: 'patient.demo',
    name: 'Sara Bennani',
    role: 'PATIENT',
    label: 'Patient',
    summary: 'Their own records, and nothing else',
    patientId: 1,
  },
  {
    username: 'lab.demo',
    name: 'Tarik Lab',
    role: 'LAB_TECHNICIAN',
    label: 'Lab technician',
    summary: 'Laboratory requests and results only',
  },
  {
    username: 'nurse.demo',
    name: 'Meryem Nurse',
    role: 'NURSE',
    label: 'Nurse',
    summary: 'The register and the day',
  },
  {
    username: 'billing.demo',
    name: 'Hicham Billing',
    role: 'BILLING',
    label: 'Billing',
    summary: 'The ledger',
  },
]

export function accountFor(username) {
  return DEMO_ACCOUNTS.find((a) => a.username === username) ?? null
}
