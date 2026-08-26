/**
 * StatusBadge.jsx — how every state in the product is written down.
 *
 * The colours are assigned by what the state asks of the reader, not by what
 * kind of record it belongs to. Two consequences worth stating, because both
 * were wrong before:
 *
 *   A cancelled appointment and a voided invoice are not errors. They are
 *   closed, correctly, and nothing further is expected. They are grey. Painting
 *   them red pulled the eye to the one row on the page that needed no attention.
 *
 *   Only two things are ever warm: a state waiting on a human decision (amber)
 *   and a payment that is genuinely late (rose). If a screen looks warm, work
 *   is piling up on it — and that is information.
 */

/**
 * tone → the reader's obligation
 *   live  teal    running, and running correctly
 *   wait  amber   somebody has to decide something
 *   work  blue    in flight elsewhere; nothing to do yet
 *   miss  orange  the patient did not come
 *   late  rose    past due
 *   done  neutral finished well; the dot stays teal so a completed row still
 *                 reads as a success at a glance
 *   off   neutral closed, and no longer expected
 */
const TONES = {
  live: { text: 'text-teal-300', fill: 'bg-teal-400/10', dot: 'bg-teal-400' },
  wait: { text: 'text-amber-300', fill: 'bg-amber-400/10', dot: 'bg-amber-400' },
  work: { text: 'text-blue-400', fill: 'bg-blue-400/10', dot: 'bg-blue-400' },
  miss: { text: 'text-orange-400', fill: 'bg-orange-400/10', dot: 'bg-orange-400' },
  late: { text: 'text-rose-300', fill: 'bg-rose-400/10', dot: 'bg-rose-400' },
  done: { text: 'text-slate-300', fill: 'bg-white/[0.05]', dot: 'bg-teal-500' },
  off: { text: 'text-slate-400', fill: 'bg-white/[0.05]', dot: 'bg-slate-600' },
}

const STATUS = {
  // ── Appointment lifecycle ─────────────────────────────────────────
  REQUESTED: { label: 'Requested', tone: 'wait' },
  CONFIRMED: { label: 'Confirmed', tone: 'live' },
  COMPLETED: { label: 'Completed', tone: 'done' },
  CANCELLED: { label: 'Cancelled', tone: 'off' },
  NO_SHOW: { label: 'Did not attend', tone: 'miss' },

  // ── Invoice lifecycle ─────────────────────────────────────────────
  ISSUED: { label: 'Outstanding', tone: 'wait' },
  PAID: { label: 'Paid', tone: 'live' },
  VOID: { label: 'Void', tone: 'off' },
  REFUNDED: { label: 'Refunded', tone: 'work' },
  OVERDUE: { label: 'Overdue', tone: 'late' },

  // ── Laboratory ────────────────────────────────────────────────────
  PENDING: { label: 'Awaiting sample', tone: 'wait' },
  IN_PROGRESS: { label: 'In the lab', tone: 'work' },

  // ── Generic ───────────────────────────────────────────────────────
  ACTIVE: { label: 'Active', tone: 'live' },
  INACTIVE: { label: 'Inactive', tone: 'off' },
}

/** Sentence-case fallback, so an unmapped server value still reads as English. */
function humanise(status) {
  if (!status) return 'Unknown'
  const words = String(status).toLowerCase().replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * @param {{
 *   status: string, size?: 'sm'|'md', className?: string,
 *   label?: string
 * }} props
 *   `label` overrides the wording while keeping the colour. The patient portal
 *   uses it: "Requested" is how the clinic's state machine names a slot nobody
 *   has answered yet, and "Awaiting confirmation" is what that means to the
 *   person who asked for it.
 */
export default function StatusBadge({ status, size = 'md', className = '', label }) {
  const base = STATUS[status] ?? { label: humanise(status), tone: 'off' }
  const config = label ? { ...base, label } : base
  const tone = TONES[config.tone]

  const scale =
    size === 'sm' ? 'px-1.5 py-0.5 text-micro gap-1.5' : 'px-2 py-1 text-meta gap-1.5'

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm font-medium
                  ${scale} ${tone.fill} ${tone.text} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${tone.dot}`}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}

/** The same vocabulary, for callers that need the colour without the badge. */
export function statusTone(status) {
  return TONES[(STATUS[status] ?? { tone: 'off' }).tone]
}

export function statusLabel(status) {
  return (STATUS[status] ?? { label: humanise(status) }).label
}
