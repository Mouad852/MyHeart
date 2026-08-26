/**
 * StatusBadge.jsx — how every state in the product is written down.
 *
 * Four colours, four meanings, and one uncoloured state. The clinical guidance
 * on interface colour coding caps it at four with fixed meanings, and requires
 * colour to be paired with a word or a symbol, because a hue on its own is
 * nothing to a colour-blind reader. Every badge here therefore carries a word,
 * and the dot is a second channel rather than the message.
 *
 *   attention  a decision is owed, or money is
 *   critical   late, failed, or about to be destroyed
 *   settled    paid, confirmed, done
 *   closed     correctly finished; nothing further is expected
 *   open       in flight somewhere else; nothing is owed by the reader
 *
 * `open` is the fifth state and deliberately not a fifth colour. A sample sitting
 * in the laboratory is not urgent, not finished and not closed; it is drawn in
 * plain ink with a hollow dot, so the difference is carried by form. That is how
 * the palette holds at four while the state machine has more states than that.
 *
 * Two consequences worth stating, because both were the other way round before:
 *
 *   A cancelled appointment and a voided invoice are grey. They are closed,
 *   correctly, and nothing further is expected. Red on them spent the reader's
 *   attention on the one row that needed none.
 *
 *   A patient who did not attend is amber, not a colour of their own. Somebody
 *   has to deal with it, which is exactly what attention means.
 */

const TONES = {
  attention: { text: 'text-attention', fill: 'bg-attention-soft', dot: 'bg-attention' },
  critical: { text: 'text-critical', fill: 'bg-critical-soft', dot: 'bg-critical' },
  settled: { text: 'text-settled', fill: 'bg-settled-soft', dot: 'bg-settled' },
  closed: { text: 'text-ink-3', fill: 'bg-closed-soft', dot: 'bg-closed' },
  // Hollow dot, no colour: in flight, and nothing is asked of the reader.
  open: {
    text: 'text-ink-2',
    fill: 'bg-closed-soft',
    dot: 'border border-ink-3 bg-transparent',
  },
}

const STATUS = {
  // ── Appointment lifecycle ─────────────────────────────────────────
  REQUESTED: { label: 'Requested', tone: 'attention' },
  CONFIRMED: { label: 'Confirmed', tone: 'settled' },
  COMPLETED: { label: 'Completed', tone: 'settled' },
  CANCELLED: { label: 'Cancelled', tone: 'closed' },
  NO_SHOW: { label: 'Did not attend', tone: 'attention' },

  // ── Invoice lifecycle ─────────────────────────────────────────────
  ISSUED: { label: 'Outstanding', tone: 'attention' },
  PAID: { label: 'Paid', tone: 'settled' },
  OVERDUE: { label: 'Overdue', tone: 'critical' },
  VOID: { label: 'Void', tone: 'closed' },
  REFUNDED: { label: 'Refunded', tone: 'closed' },

  // ── Laboratory ────────────────────────────────────────────────────
  PENDING: { label: 'Awaiting sample', tone: 'open' },
  IN_PROGRESS: { label: 'In the lab', tone: 'open' },

  // ── Generic ───────────────────────────────────────────────────────
  ACTIVE: { label: 'Active', tone: 'settled' },
  INACTIVE: { label: 'Inactive', tone: 'closed' },
}

/** Sentence case, so an unmapped server value still reads as English. */
function humanise(status) {
  if (!status) return 'Unknown'
  const words = String(status).toLowerCase().replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * @param {{
 *   status: string, size?: 'sm'|'md', className?: string, label?: string
 * }} props
 *   `label` overrides the wording while keeping the meaning. The patient portal
 *   uses it: "Requested" is how the clinic's state machine names a slot nobody
 *   has answered, and "Awaiting confirmation" is what that means to the person
 *   who asked for it.
 */
export default function StatusBadge({ status, size = 'md', className = '', label }) {
  const base = STATUS[status] ?? { label: humanise(status), tone: 'closed' }
  const config = label ? { ...base, label } : base
  const tone = TONES[config.tone]

  const scale = size === 'sm' ? 'px-1.5 py-0.5 text-micro' : 'px-2 py-0.5 text-meta'

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm
                  font-medium ${scale} ${tone.fill} ${tone.text} ${className}`}
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
  return TONES[(STATUS[status] ?? { tone: 'closed' }).tone]
}

export function statusLabel(status) {
  return (STATUS[status] ?? { label: humanise(status) }).label
}
