/**
 * adapter.js — the demo's stand-in for six microservices and a gateway.
 *
 * Installed as an axios adapter, so it sits exactly where the network sits.
 * Nothing above it changes: the service modules, React Query, the interceptors
 * and every screen behave as though the gateway answered.
 *
 * Two rule sets are reproduced here rather than approximated.
 *
 * The gateway's path and role rules are transcribed from the api-gateway
 * SecurityConfig, method by method, so a role that gets 403 in the real system
 * gets 403 here — a lab technician still cannot read the patient register, and
 * a doctor still cannot open the ledger.
 *
 * Ownership is decided the way CallerIdentity decides it: a patient reads the
 * record whose id matches their claim and no other, and a collection is
 * narrowed to them rather than filtered after the fact.
 *
 * This is a fidelity exercise, not a security boundary. There is no server to
 * defend and the data is fictional. The point is that the screens tell the
 * truth about how the real system behaves.
 */
import {
  ACTIVE_STATUSES,
  SERVICES,
  downServices,
  allowedAppointmentTransitions,
  allowedInvoiceTransitions,
  currentAccount,
  db,
  enrichAppointment,
  enrichInvoice,
  isDown,
  newId,
  now,
  page,
} from './store'

/** Rough network delay, so loading states and skeletons are visible. */
const LATENCY_MS = 220

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const forbidden = (m = 'Access denied.') => new HttpError(403, m)
const notFound = (m = 'Not found.') => new HttpError(404, m)

/** What a service being unreachable looks like from the browser. */
function requireUp(service) {
  if (isDown(service)) {
    throw new HttpError(503, `${service} service is temporarily unavailable.`)
  }
}

// ── The gateway's rules, transcribed ────────────────────────────
const RULES = [
  ['GET', /^\/patients/, ['DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST', 'PATIENT']],
  ['POST', /^\/patients/, ['RECEPTIONIST', 'ADMIN']],
  ['PUT', /^\/patients/, ['RECEPTIONIST', 'ADMIN']],
  ['DELETE', /^\/patients/, ['ADMIN']],
  ['*', /^\/patients/, ['ADMIN', 'RECEPTIONIST']],

  ['GET', /^\/doctors/, ['DOCTOR', 'ADMIN', 'RECEPTIONIST']],
  ['*', /^\/doctors/, ['ADMIN']],

  ['GET', /^\/appointments/, ['DOCTOR', 'ADMIN', 'RECEPTIONIST', 'PATIENT']],
  ['POST', /^\/appointments$/, ['RECEPTIONIST', 'ADMIN', 'PATIENT']],
  ['POST', /^\/appointments/, ['RECEPTIONIST', 'ADMIN']],
  ['PUT', /^\/appointments/, ['RECEPTIONIST', 'ADMIN']],
  ['DELETE', /^\/appointments/, ['RECEPTIONIST', 'ADMIN']],
  ['*', /^\/appointments/, ['RECEPTIONIST', 'ADMIN', 'DOCTOR']],

  ['GET', /^\/billing/, ['BILLING', 'ADMIN', 'RECEPTIONIST']],
  ['POST', /^\/billing/, ['BILLING', 'ADMIN']],
  ['*', /^\/billing\/pay/, ['BILLING', 'ADMIN', 'RECEPTIONIST']],
  ['*', /^\/billing/, ['BILLING', 'ADMIN']],

  ['GET', /^\/prescriptions/, ['DOCTOR', 'ADMIN', 'RECEPTIONIST', 'PATIENT']],
  ['POST', /^\/prescriptions/, ['DOCTOR', 'ADMIN']],
  ['*', /^\/prescriptions/, ['DOCTOR', 'ADMIN']],

  ['GET', /^\/labs/, ['DOCTOR', 'ADMIN', 'RECEPTIONIST', 'PATIENT', 'LAB_TECHNICIAN']],
  // Filing a report and writing the finding are separate permissions, and the
  // laboratory screen tracks them separately because of this line.
  ['POST', /^\/labs\/results\/[^/]+\/file/, ['DOCTOR', 'ADMIN', 'LAB_TECHNICIAN']],
  ['POST', /^\/labs/, ['DOCTOR', 'ADMIN']],
  ['*', /^\/labs/, ['DOCTOR', 'ADMIN']],
]

function authorise(method, path, role) {
  for (const [ruleMethod, pattern, roles] of RULES) {
    if ((ruleMethod === method || ruleMethod === '*') && pattern.test(path)) {
      if (!roles.includes(role)) throw forbidden()
      return
    }
  }
}

// ── Ownership, the way CallerIdentity decides it ────────────────
const isPatientRole = (account) => account?.role === 'PATIENT'

/** A patient may read their own record; anything else is 403, never 404. */
function assertOwnPatient(account, patientId) {
  if (isPatientRole(account) && Number(patientId) !== Number(account.patientId)) {
    throw forbidden('You may only view your own records.')
  }
}

/** Narrow a collection to the caller rather than filtering the response. */
function scopeToCaller(account, rows, key = 'patientId') {
  if (!isPatientRole(account)) return rows
  return rows.filter((r) => Number(r[key]) === Number(account.patientId))
}

const byId = (rows, id) => rows.find((r) => Number(r.id) === Number(id))

const matches = (row, term, fields) =>
  !term ||
  fields.some((f) => String(row[f] ?? '').toLowerCase().includes(term.toLowerCase()))

// ── Routes ──────────────────────────────────────────────────────
// Each entry: [method, pattern, handler]. The first match wins, so specific
// paths are declared before the ones carrying an id.
const routes = []
const route = (method, pattern, handler) => routes.push([method, pattern, handler])

// ---- patients --------------------------------------------------
route('GET', /^\/patients\/batch$/, ({ params }) => {
  requireUp('patients')
  const ids = String(params.ids ?? '').split(',').filter(Boolean).map(Number)
  return db.patients.filter((p) => ids.includes(p.id))
})

route('GET', /^\/patients$/, ({ params, account }) => {
  requireUp('patients')
  const rows = scopeToCaller(account, db.patients, 'id').filter((p) =>
    matches(p, params.q, ['name', 'email', 'phone'])
  )
  return page([...rows].sort((a, b) => a.name.localeCompare(b.name)), params)
})

route('GET', /^\/patients\/(\d+)$/, ({ id, account }) => {
  requireUp('patients')
  assertOwnPatient(account, id)
  return byId(db.patients, id) ?? notFound('Patient not found.')
})

route('POST', /^\/patients$/, ({ body }) => {
  requireUp('patients')
  const patient = {
    id: newId('patients'),
    ...body,
    createdAt: now(),
    updatedAt: now(),
  }
  db.patients.push(patient)
  return patient
})

route('PUT', /^\/patients\/(\d+)$/, ({ id, body }) => {
  requireUp('patients')
  const patient = byId(db.patients, id)
  if (!patient) throw notFound('Patient not found.')
  Object.assign(patient, body, { updatedAt: now() })
  return patient
})

route('DELETE', /^\/patients\/(\d+)$/, ({ id }) => {
  requireUp('patients')
  const index = db.patients.findIndex((p) => Number(p.id) === Number(id))
  if (index === -1) throw notFound('Patient not found.')
  db.patients.splice(index, 1)
  return null
})

// ---- doctors ---------------------------------------------------
route('GET', /^\/doctors\/batch$/, ({ params }) => {
  requireUp('doctors')
  const ids = String(params.ids ?? '').split(',').filter(Boolean).map(Number)
  return db.doctors.filter((d) => ids.includes(d.id))
})

route('GET', /^\/doctors$/, ({ params }) => {
  requireUp('doctors')
  const rows = db.doctors.filter((d) =>
    matches(d, params.q, ['name', 'specialty', 'email'])
  )
  return page([...rows].sort((a, b) => a.name.localeCompare(b.name)), params)
})

route('GET', /^\/doctors\/(\d+)$/, ({ id }) => {
  requireUp('doctors')
  return byId(db.doctors, id) ?? notFound('Doctor not found.')
})

route('POST', /^\/doctors$/, ({ body }) => {
  requireUp('doctors')
  const doctor = { id: newId('doctors'), ...body, createdAt: now(), updatedAt: now() }
  db.doctors.push(doctor)
  return doctor
})

route('PUT', /^\/doctors\/(\d+)$/, ({ id, body }) => {
  requireUp('doctors')
  const doctor = byId(db.doctors, id)
  if (!doctor) throw notFound('Doctor not found.')
  Object.assign(doctor, body, { updatedAt: now() })
  return doctor
})

route('DELETE', /^\/doctors\/(\d+)$/, ({ id }) => {
  requireUp('doctors')
  const index = db.doctors.findIndex((d) => Number(d.id) === Number(id))
  if (index === -1) throw notFound('Doctor not found.')
  db.doctors.splice(index, 1)
  return null
})

// ---- appointments ----------------------------------------------
route('GET', /^\/appointments\/my-day$/, ({ params, account }) => {
  requireUp('appointments')
  const day = params.day || now().slice(0, 10)
  // Scoped from the doctorId claim, never from a parameter, so it cannot be
  // pointed at a colleague's calendar.
  const doctorId = account?.doctorId
  const rows = db.appointments
    .filter(
      (a) =>
        Number(a.doctorId) === Number(doctorId) &&
        a.appointmentDate.slice(0, 10) === day
    )
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
  // A page envelope, which is what appointment-service returns here — checked
  // against the running stack, because the Today screen reads data.content and
  // a bare array renders as an empty day rather than as an error.
  const paged = page(rows, { page: 0, size: Math.max(rows.length, 1) })
  return { ...paged, content: paged.content.map(enrichAppointment) }
})

route('GET', /^\/appointments\/search$/, ({ params, account }) => {
  requireUp('appointments')
  let rows = scopeToCaller(account, db.appointments)
  if (params.doctorId) rows = rows.filter((a) => Number(a.doctorId) === Number(params.doctorId))
  if (params.patientId) rows = rows.filter((a) => Number(a.patientId) === Number(params.patientId))
  if (params.status) rows = rows.filter((a) => a.status === params.status)
  if (params.from) rows = rows.filter((a) => a.appointmentDate >= params.from)
  if (params.to) rows = rows.filter((a) => a.appointmentDate <= params.to)
  rows = [...rows].sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
  const paged = page(rows, params)
  return { ...paged, content: paged.content.map(enrichAppointment) }
})

route('GET', /^\/appointments$/, ({ account }) => {
  requireUp('appointments')
  return scopeToCaller(account, db.appointments)
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
    .map(enrichAppointment)
})

route('GET', /^\/appointments\/(\d+)$/, ({ id, account }) => {
  requireUp('appointments')
  const appointment = byId(db.appointments, id)
  if (!appointment) throw notFound('Appointment not found.')
  assertOwnPatient(account, appointment.patientId)
  return enrichAppointment(appointment)
})

route('POST', /^\/appointments$/, ({ body, account }) => {
  requireUp('appointments')
  const start = body.appointmentDate
  const minutes = body.durationMinutes ?? 30
  const end = new Date(new Date(start).getTime() + minutes * 60000).toISOString().slice(0, 19)

  // Half-open intervals, so a booking that merely touches the end of another
  // is allowed and one that overlaps is refused.
  const clash = db.appointments.find((a) => {
    if (Number(a.doctorId) !== Number(body.doctorId)) return false
    if (!ACTIVE_STATUSES.includes(a.status)) return false
    const aEnd = new Date(
      new Date(a.appointmentDate).getTime() + a.durationMinutes * 60000
    )
      .toISOString()
      .slice(0, 19)
    return a.appointmentDate < end && start < aEnd
  })
  if (clash) {
    throw new HttpError(409, 'That slot overlaps an existing appointment for this doctor.')
  }

  // Who books decides where it starts: the desk agrees a slot, a patient can
  // only ask for one.
  const status = account?.role === 'PATIENT' ? 'REQUESTED' : 'CONFIRMED'
  const appointment = {
    id: newId('appointments'),
    patientId: Number(body.patientId),
    doctorId: Number(body.doctorId),
    appointmentDate: start,
    durationMinutes: minutes,
    status,
    notes: body.notes ?? null,
    cancellationReason: null,
    statusChangedAt: null,
    createdAt: now(),
  }
  db.appointments.push(appointment)

  // An invoice is raised on confirmation, not on request.
  if (status === 'CONFIRMED') raiseInvoice(appointment)
  return enrichAppointment(appointment)
})

function transition(id, target, reason) {
  const appointment = byId(db.appointments, id)
  if (!appointment) throw notFound('Appointment not found.')
  if (!allowedAppointmentTransitions(appointment.status).includes(target)) {
    throw new HttpError(
      409,
      `An appointment that is ${appointment.status.toLowerCase()} cannot become ${target.toLowerCase()}.`
    )
  }
  appointment.status = target
  appointment.statusChangedAt = now()
  if (reason) appointment.cancellationReason = reason
  if (target === 'CONFIRMED') raiseInvoice(appointment)
  return enrichAppointment(appointment)
}

/** Idempotent by appointment, as the unique constraint enforces. */
function raiseInvoice(appointment) {
  if (isDown('billing')) return
  const existing = db.invoices.find(
    (i) => Number(i.appointmentId) === Number(appointment.id)
  )
  if (existing) return
  const service =
    db.clinicServices.find((s) => s.durationMinutes === appointment.durationMinutes) ??
    db.clinicServices.find((s) => s.code === 'CONSULTATION')
  const due = new Date()
  due.setDate(due.getDate() + 30)
  db.invoices.push({
    id: newId('invoices'),
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    amount: service.price,
    currency: 'MAD',
    status: 'ISSUED',
    description: service.name,
    serviceCode: service.code,
    issuedAt: now(),
    dueDate: due.toISOString().slice(0, 10),
    paymentMethod: null,
    paidAt: null,
    voidReason: null,
    createdAt: now(),
  })
}

route('PATCH', /^\/appointments\/(\d+)\/confirm$/, ({ id }) => {
  requireUp('appointments')
  return transition(id, 'CONFIRMED')
})
route('PATCH', /^\/appointments\/(\d+)\/complete$/, ({ id }) => {
  requireUp('appointments')
  return transition(id, 'COMPLETED')
})
route('PATCH', /^\/appointments\/(\d+)\/cancel$/, ({ id, params }) => {
  requireUp('appointments')
  return transition(id, 'CANCELLED', params.reason || 'Cancelled')
})
route('PATCH', /^\/appointments\/(\d+)\/no-show$/, ({ id, params }) => {
  requireUp('appointments')
  return transition(id, 'NO_SHOW', params.reason)
})
route('PATCH', /^\/appointments\/(\d+)$/, ({ id, body }) => {
  requireUp('appointments')
  const appointment = byId(db.appointments, id)
  if (!appointment) throw notFound('Appointment not found.')
  Object.assign(appointment, body)
  return enrichAppointment(appointment)
})

// ---- billing ---------------------------------------------------
route('GET', /^\/billing\/summary$/, () => {
  requireUp('billing')
  const today = now().slice(0, 10)
  const rows = db.invoices
  const total = (status) =>
    rows.filter((i) => i.status === status).reduce((s, i) => s + i.amount, 0)
  const count = (status) => rows.filter((i) => i.status === status).length
  const overdue = rows.filter((i) => i.status === 'ISSUED' && i.dueDate < today)
  return {
    byStatus: ['ISSUED', 'PAID', 'VOID', 'REFUNDED'].map((status) => ({
      status,
      count: count(status),
      amount: total(status),
    })),
    outstandingCount: count('ISSUED'),
    outstandingAmount: total('ISSUED'),
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
    collectedCount: count('PAID'),
    collectedAmount: total('PAID'),
    invoiceCount: rows.length,
    currency: 'MAD',
  }
})

route('GET', /^\/billing\/services$/, () => {
  requireUp('billing')
  return db.clinicServices
})

route('GET', /^\/billing\/patient\/(\d+)$/, ({ id, account }) => {
  requireUp('billing')
  assertOwnPatient(account, id)
  return db.invoices
    .filter((i) => Number(i.patientId) === Number(id))
    .map(enrichInvoice)
})

route('GET', /^\/billing$/, ({ account }) => {
  requireUp('billing')
  const rows = scopeToCaller(account, db.invoices)
    .slice()
    // Oldest debt first: the question a billing clerk arrives with.
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  return rows.map(enrichInvoice)
})

route('GET', /^\/billing\/(\d+)$/, ({ id, account }) => {
  requireUp('billing')
  const invoice = byId(db.invoices, id)
  if (!invoice) throw notFound('Invoice not found.')
  assertOwnPatient(account, invoice.patientId)
  return enrichInvoice(invoice)
})

route('POST', /^\/billing\/create$/, ({ body }) => {
  requireUp('billing')
  const due = new Date()
  due.setDate(due.getDate() + 30)
  const invoice = {
    id: newId('invoices'),
    ...body,
    currency: 'MAD',
    status: 'ISSUED',
    issuedAt: now(),
    dueDate: due.toISOString().slice(0, 10),
    paidAt: null,
    createdAt: now(),
  }
  db.invoices.push(invoice)
  return enrichInvoice(invoice)
})

function moveInvoice(id, target, reason) {
  const invoice = byId(db.invoices, id)
  if (!invoice) throw notFound('Invoice not found.')
  if (!allowedInvoiceTransitions(invoice.status).includes(target)) {
    throw new HttpError(
      409,
      `An invoice that is ${invoice.status.toLowerCase()} cannot become ${target.toLowerCase()}.`
    )
  }
  invoice.status = target
  if (target === 'PAID') {
    invoice.paidAt = now()
    invoice.paymentMethod = invoice.paymentMethod ?? 'CASH'
  }
  if (target === 'VOID') invoice.voidReason = reason || 'Voided'
  return enrichInvoice(invoice)
}

route('PUT', /^\/billing\/pay\/(\d+)$/, ({ id }) => {
  requireUp('billing')
  return moveInvoice(id, 'PAID')
})
route('PUT', /^\/billing\/void\/(\d+)$/, ({ id, params }) => {
  requireUp('billing')
  return moveInvoice(id, 'VOID', params.reason)
})
route('PUT', /^\/billing\/refund\/(\d+)$/, ({ id, params }) => {
  requireUp('billing')
  return moveInvoice(id, 'REFUNDED', params.reason)
})

// ---- prescriptions ---------------------------------------------
route('GET', /^\/prescriptions\/patient\/(\d+)$/, ({ id, account }) => {
  requireUp('prescriptions')
  assertOwnPatient(account, id)
  return db.prescriptions.filter((p) => Number(p.patientId) === Number(id))
})

route('GET', /^\/prescriptions\/doctor\/(\d+)$/, ({ id }) => {
  requireUp('prescriptions')
  return db.prescriptions.filter((p) => Number(p.doctorId) === Number(id))
})

route('GET', /^\/prescriptions\/(\d+)\/document$/, ({ id }) => {
  requireUp('prescriptions')
  const prescription = byId(db.prescriptions, id)
  if (!prescription) throw notFound('Prescription not found.')
  return { __blob: buildPrescriptionText(prescription), __type: 'text/plain' }
})

route('GET', /^\/prescriptions$/, ({ account }) => {
  requireUp('prescriptions')
  const rows = scopeToCaller(account, db.prescriptions).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )
  return rows
})

route('GET', /^\/prescriptions\/(\d+)$/, ({ id, account }) => {
  requireUp('prescriptions')
  const prescription = byId(db.prescriptions, id)
  if (!prescription) throw notFound('Prescription not found.')
  assertOwnPatient(account, prescription.patientId)
  return prescription
})

route('POST', /^\/prescriptions$/, ({ body }) => {
  requireUp('prescriptions')
  const prescription = {
    id: newId('prescriptions'),
    patientId: Number(body.patientId),
    doctorId: Number(body.doctorId),
    diagnosis: body.diagnosis,
    notes: body.notes ?? null,
    createdAt: now(),
    items: (body.items ?? []).map((item, i) => ({ id: Date.now() + i, ...item })),
  }
  db.prescriptions.push(prescription)
  return prescription
})

/**
 * The printed prescription is generated server-side by OpenPDF, which cannot
 * be reproduced in the browser without shipping a PDF library for one button.
 * The demo hands back the same document as text so the workflow is intact and
 * says plainly what it is, rather than offering a Print button that does
 * nothing.
 */
function buildPrescriptionText(prescription) {
  const patient = byId(db.patients, prescription.patientId)
  const doctor = byId(db.doctors, prescription.doctorId)
  const lines = [
    'MEDCORE CLINIC — PRESCRIPTION',
    '',
    'DEMONSTRATION ONLY. Produced by a portfolio project.',
    'This is not a valid prescription.',
    '',
    'In the real system this is an A4 PDF rendered by prescription-service',
    'with OpenPDF: letterhead, medication table and a signature line.',
    '',
    `Patient    ${patient?.name ?? `#${prescription.patientId}`}`,
    `Prescriber ${doctor?.name ?? `#${prescription.doctorId}`}`,
    `Date       ${prescription.createdAt.slice(0, 10)}`,
    `Diagnosis  ${prescription.diagnosis}`,
    '',
    'MEDICATION',
    ...prescription.items.flatMap((item) => [
      `  ${item.medicineName} — ${item.dosage}, ${item.frequency}, ${item.duration}`,
      item.instructions ? `      ${item.instructions}` : null,
    ]),
    '',
    prescription.notes ? `Notes: ${prescription.notes}` : null,
    '',
    'Signature ______________________',
  ]
  return lines.filter((l) => l !== null).join('\n')
}

// ---- labs ------------------------------------------------------
route('GET', /^\/labs\/requests$/, ({ account }) => {
  requireUp('labs')
  return scopeToCaller(account, db.labRequests).sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt)
  )
})

route('GET', /^\/labs\/patient\/(\d+)$/, ({ id, account }) => {
  requireUp('labs')
  assertOwnPatient(account, id)
  return db.labRequests.filter((r) => Number(r.patientId) === Number(id))
})

route('GET', /^\/labs\/(\d+)\/results$/, ({ id, account }) => {
  requireUp('labs')
  const request = byId(db.labRequests, id)
  if (!request) throw notFound('Request not found.')
  assertOwnPatient(account, request.patientId)
  return db.labResults.filter((r) => Number(r.labRequestId) === Number(id))
})

route('POST', /^\/labs\/requests$/, ({ body }) => {
  requireUp('labs')
  const request = {
    id: newId('labRequests'),
    patientId: Number(body.patientId),
    doctorId: Number(body.doctorId),
    testName: body.testName,
    testDescription: body.testDescription ?? null,
    status: 'PENDING',
    requestedAt: now(),
  }
  db.labRequests.push(request)
  return request
})

route('POST', /^\/labs\/result$/, ({ body }) => {
  requireUp('labs')
  const request = byId(db.labRequests, body.labRequestId)
  if (!request) throw notFound('Request not found.')
  const result = {
    id: newId('labResults'),
    labRequestId: Number(body.labRequestId),
    resultText: body.resultText,
    observations: body.observations ?? null,
    resultedAt: now(),
    filePath: null,
    fileName: null,
    fileContentType: null,
    fileSize: null,
    fileUploadedAt: null,
  }
  db.labResults.push(result)
  request.status = 'COMPLETED'
  return result
})

route('POST', /^\/labs\/results\/(\d+)\/file$/, ({ id, config }) => {
  requireUp('labs')
  const result = byId(db.labResults, id)
  if (!result) throw notFound('Result not found.')
  const file = config.data instanceof FormData ? config.data.get('file') : null
  if (!file) throw new HttpError(400, 'No file was received.')
  result.fileName = file.name
  result.fileContentType = file.type
  result.fileSize = file.size
  result.filePath = `demo/${result.id}/${file.name}`
  result.fileUploadedAt = now()
  // Held in memory for this tab only, which is why the demo says so.
  fileStore.set(String(result.id), file)
  return result
})

const fileStore = new Map()

route('GET', /^\/labs\/results\/(\d+)\/file$/, ({ id }) => {
  requireUp('labs')
  const file = fileStore.get(String(id))
  if (!file) throw notFound('No report is attached to this result.')
  return { __blob: file, __type: file.type }
})

// ── The adapter itself ──────────────────────────────────────────
function resolve(config) {
  const base = config.baseURL ?? ''
  let path = config.url ?? ''
  if (base && path.startsWith(base)) path = path.slice(base.length)
  path = path.replace(/\/+$/, '') || '/'

  const method = (config.method ?? 'get').toUpperCase()

  // permitAll on the gateway, and polled by the sidebar before anyone has
  // signed in, so it is answered ahead of the account check. It reports what
  // the outage switches say: turning a service off makes the sidebar read
  // "Some services degraded", which is the honest answer and the same one the
  // real actuator would give.
  if (path === '/actuator/health') {
    const down = downServices()
    return {
      status: down.length === 0 ? 'UP' : 'DOWN',
      components: Object.fromEntries(
        SERVICES.map((s) => [s.key, { status: down.includes(s.key) ? 'DOWN' : 'UP' }])
      ),
    }
  }

  const account = currentAccount()
  if (!account) throw new HttpError(401, 'Not signed in.')

  authorise(method, path, account.role)

  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue
    const match = pattern.exec(path)
    if (!match) continue
    let body = config.data
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        /* not JSON — a multipart upload, handled through config.data */
      }
    }
    const result = handler({
      id: match[1],
      params: config.params ?? {},
      body,
      account,
      config,
    })
    if (result instanceof HttpError) throw result
    return result
  }

  throw notFound(`No demo route for ${method} ${path}`)
}

export default function demoAdapter(config) {
  return new Promise((resolve_, reject) => {
    setTimeout(() => {
      try {
        const data = resolve(config)
        if (data && data.__blob !== undefined) {
          const blob =
            data.__blob instanceof Blob
              ? data.__blob
              : new Blob([data.__blob], { type: data.__type })
          resolve_({ data: blob, status: 200, statusText: 'OK', headers: {}, config })
          return
        }
        resolve_({
          data,
          status: data === null ? 204 : 200,
          statusText: 'OK',
          headers: {},
          config,
        })
      } catch (error) {
        const status = error.status ?? 500
        reject({
          isAxiosError: true,
          config,
          response: {
            status,
            statusText: String(status),
            headers: {},
            config,
            data: { status, message: error.message, timestamp: now() },
          },
        })
      }
    }, LATENCY_MS)
  })
}
