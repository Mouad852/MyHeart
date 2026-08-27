/**
 * store.js — the demo clinic's state, and who is looking at it.
 *
 * Everything lives in memory for the life of the tab. Edits made in the demo
 * are real edits — confirming a slot, paying an invoice, registering a patient
 * all work and persist until reload — because a demo where the buttons do
 * nothing teaches a visitor that the buttons do nothing.
 *
 * The signed-in account and the outage switches are mirrored into
 * sessionStorage so a page reload does not sign you out mid-look. The data is
 * not: reload is the reset, which is also how the hosted demo stays tidy
 * without anybody administering it.
 */
import {
  appointments,
  clinicServices,
  doctors,
  invoices,
  labRequests,
  labResults,
  patients,
  prescriptions,
  iso,
} from './dataset'
import { accountFor } from './config'

const SESSION_KEY = 'demo.account'
const OUTAGE_KEY = 'demo.outages'

/** Deep-ish copy, so a reset restores the dataset rather than the last edit. */
const clone = (rows) => rows.map((r) => ({ ...r }))

export const db = {
  patients: clone(patients),
  doctors: clone(doctors),
  appointments: clone(appointments),
  invoices: clone(invoices),
  prescriptions: prescriptions.map((p) => ({ ...p, items: clone(p.items) })),
  labRequests: clone(labRequests),
  labResults: clone(labResults),
  clinicServices: clone(clinicServices),
}

/** Ids continue from the seeded rows, as the sequence reset in SQL ensures. */
const nextId = (rows) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1

// ── The state machines, copied from the services ─────────────────
// AppointmentStatus.ALLOWED and PaymentStatus.ALLOWED. They are duplicated
// rather than approximated: `allowedTransitions` is what every row's actions
// are built from, so a demo that guesses them offers buttons the real system
// would refuse — which is the exact failure the real UI was designed to avoid.
const APPOINTMENT_TRANSITIONS = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

const INVOICE_TRANSITIONS = {
  ISSUED: ['PAID', 'VOID'],
  PAID: ['REFUNDED'],
  VOID: [],
  REFUNDED: [],
}

export const allowedAppointmentTransitions = (status) =>
  APPOINTMENT_TRANSITIONS[status] ?? []

export const allowedInvoiceTransitions = (status) =>
  INVOICE_TRANSITIONS[status] ?? []

/** Statuses that still hold a slot in the calendar. */
export const ACTIVE_STATUSES = ['REQUESTED', 'CONFIRMED']

// ── Who is signed in ────────────────────────────────────────────
let account = null
try {
  account = accountFor(sessionStorage.getItem(SESSION_KEY))
} catch {
  // sessionStorage can throw in a private window or a sandboxed frame.
}

export function currentAccount() {
  return account
}

export function signIn(username) {
  account = accountFor(username)
  try {
    if (account) sessionStorage.setItem(SESSION_KEY, username)
  } catch {
    /* not fatal — the session simply does not survive a reload */
  }
  return account
}

export function signOut() {
  account = null
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignored */
  }
}

// ── The outage switches ─────────────────────────────────────────
// The real product treats partial failure as a designed state: one service
// down names itself in place, with a retry, while the rest of the screen keeps
// working, and a failed source's count reads as unknown rather than as zero.
// Against a live backend none of that can be shown without breaking something
// on purpose. Here it is a switch.
export const SERVICES = [
  { key: 'patients', label: 'Patient service' },
  { key: 'doctors', label: 'Doctor service' },
  { key: 'appointments', label: 'Appointment service' },
  { key: 'billing', label: 'Billing service' },
  { key: 'prescriptions', label: 'Prescription service' },
  { key: 'labs', label: 'Lab service' },
]

let outages = new Set()
try {
  outages = new Set(JSON.parse(sessionStorage.getItem(OUTAGE_KEY) || '[]'))
} catch {
  /* ignored */
}

const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  listeners.forEach((fn) => fn())
}

export const isDown = (key) => outages.has(key)
export const downServices = () => [...outages]

export function toggleService(key) {
  if (outages.has(key)) outages.delete(key)
  else outages.add(key)
  try {
    sessionStorage.setItem(OUTAGE_KEY, JSON.stringify([...outages]))
  } catch {
    /* ignored */
  }
  notify()
}

export function clearOutages() {
  outages.clear()
  try {
    sessionStorage.setItem(OUTAGE_KEY, '[]')
  } catch {
    /* ignored */
  }
  notify()
}

// ── Helpers the adapter builds responses from ───────────────────

/** The PageResponse contract, declared explicitly by every service. */
export function page(rows, { page: p = 0, size = 20 } = {}) {
  const pageNum = Number(p) || 0
  const pageSize = Number(size) || 20
  const start = pageNum * pageSize
  const content = rows.slice(start, start + pageSize)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  return {
    content,
    page: pageNum,
    size: pageSize,
    totalElements: rows.length,
    totalPages,
    first: pageNum === 0,
    last: pageNum >= totalPages - 1,
  }
}

const summarise = (row, fields) =>
  row ? Object.fromEntries(fields.map((f) => [f, row[f]])) : null

/**
 * Appointments are served enriched, exactly as appointment-service composes
 * them from patient-service and doctor-service. When one of those is switched
 * off, the appointment still returns and the missing half is null — which is
 * what a circuit-breaker fallback produces, and what the screens are built to
 * survive.
 */
export function enrichAppointment(a) {
  const patient = isDown('patients')
    ? null
    : summarise(db.patients.find((p) => p.id === a.patientId), [
        'id',
        'name',
        'email',
        'phone',
      ])
  const doctor = isDown('doctors')
    ? null
    : summarise(db.doctors.find((d) => d.id === a.doctorId), [
        'id',
        'name',
        'specialty',
        'email',
      ])
  return {
    ...a,
    patient,
    doctor,
    allowedTransitions: allowedAppointmentTransitions(a.status),
  }
}

export function enrichInvoice(i) {
  return { ...i, allowedTransitions: allowedInvoiceTransitions(i.status) }
}

export function newId(collection) {
  return nextId(db[collection])
}

export function now() {
  return iso(new Date())
}
