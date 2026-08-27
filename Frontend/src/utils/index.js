/**
 * utils/index.js — shared utility functions
 */
import { format, parseISO, isValid } from 'date-fns'

/**
 * Format an ISO date string to a readable format.
 * @param {string|null} dateStr
 * @param {string} fmt - date-fns format string
 * @returns {string}
 */
export function formatDate(dateStr, fmt = 'MMM d, yyyy · h:mm a') {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    return isValid(date) ? format(date, fmt) : '—'
  } catch {
    return '—'
  }
}

/**
 * Format a date object / string for a datetime-local input value.
 */
export function toDatetimeLocal(dateStr) {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : ''
  } catch {
    return ''
  }
}

/**
 * Get minimum datetime string for appointment picker (now + 1 hour).
 */
export function getMinAppointmentDate() {
  const d = new Date()
  d.setHours(d.getHours() + 1)
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Truncate a string to maxLen characters.
 */
export function truncate(str, maxLen = 40) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

/**
 * Get initials from a name string (up to 2 characters).
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get a deterministic background color for an avatar based on a string.
 */
const AVATAR_COLORS = [
  'bg-primary-soft text-primary',
  'bg-closed-soft text-ink-2',
  'bg-violet-500/20 text-violet-400',
  'bg-attention-soft text-attention',
  'bg-critical-soft text-critical',
  'bg-emerald-500/20 text-emerald-400',
]
export function getAvatarColor(str = '') {
  const idx = str.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

/**
 * Simple client-side email validator.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Simple client-side phone validator (7–15 digits, optional + prefix).
 */
export function isValidPhone(phone) {
  return /^[+]?[0-9]{7,15}$/.test(phone)
}

/* ═══════════════════════════════════════════════════════════════════════
   How the clinic writes things down

   Three small formatters, and all three exist because the raw database value
   is not what a person reads. An identifier a receptionist reads aloud over
   the phone, an amount somebody reconciles against a bank statement and a
   number they dial are each written the way that job wants them written.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * An amount, in the local convention: space-grouped thousands and the currency
 * after the number.
 *
 *   42 180.00 MAD
 *
 * Not abbreviated, ever. "42.2k MAD" is fine on a marketing chart and wrong on
 * a screen where somebody is reconciling against a bank statement.
 */
export function money(amount, currency) {
  const value = Number(amount ?? 0)
  const digits = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/,/g, '\u00a0')
  return currency ? `${digits}\u00a0${currency}` : digits
}

/**
 * A human reference for a record.
 *
 *   reference('INV', 387, '2026-08-27')  ->  INV-2026-0387
 *   reference('P', 1042)                 ->  P-1042
 *
 * Year-scoped where the record belongs to a year — an invoice, a prescription,
 * a laboratory request are all things a clinic files by year and quotes over
 * the phone. A patient is not: they are on the register until they are not, so
 * their number carries no year.
 *
 * This is a display concern only. The id in the URL and in every request is
 * still the plain database id.
 */
export function reference(prefix, id, dateish) {
  if (id == null) return '—'
  const number = String(id).padStart(4, '0')
  if (!dateish) return `${prefix}-${number}`
  const year = String(dateish).slice(0, 4)
  return /^\d{4}$/.test(year) ? `${prefix}-${year}-${number}` : `${prefix}-${number}`
}

/**
 * A phone number in reading groups rather than as one run of digits.
 *
 *   +212661204108  ->  +212 661 20 41 08
 *
 * Moroccan numbers are grouped country code, then three, then pairs, which is
 * how they are written on a card and said out loud. Anything that does not
 * match falls back to pairs from the right, which is wrong for nobody and
 * unreadable for no one.
 */
export function formatPhone(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const digits = raw.replace(/[^\d]/g, '')
  const plus = raw.startsWith('+')

  if (plus && digits.startsWith('212') && digits.length === 12) {
    const rest = digits.slice(3)
    return `+212 ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`
  }

  if (digits.length >= 9) {
    const head = plus ? digits.slice(0, digits.length - 8) : ''
    const tail = digits.slice(digits.length - 8)
    const pairs = tail.match(/.{1,2}/g)?.join(' ') ?? tail
    return `${plus ? '+' + head + ' ' : ''}${pairs}`.trim()
  }

  return raw
}
