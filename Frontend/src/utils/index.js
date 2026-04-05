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
  'bg-teal-500/20 text-teal-400',
  'bg-blue-500/20 text-blue-400',
  'bg-violet-500/20 text-violet-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
  'bg-emerald-500/20 text-emerald-400',
]
export function getAvatarColor(str = '') {
  const idx = str.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

/**
 * Map appointment status to badge colours.
 */
export function getStatusBadge(status) {
  switch (status) {
    case 'SCHEDULED':
      return { className: 'bg-teal-500/15 text-teal-400', label: 'Scheduled' }
    case 'COMPLETED':
      return { className: 'bg-blue-500/15 text-blue-400', label: 'Completed' }
    case 'CANCELLED':
      return { className: 'bg-red-500/15 text-red-400', label: 'Cancelled' }
    default:
      return { className: 'bg-slate-500/15 text-slate-400', label: status }
  }
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
