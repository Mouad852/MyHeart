/**
 * StatusBadge.jsx
 * ─────────────────────────────────────────────────────────────────
 * Unified status badge component used across Billing, Labs,
 * and Prescriptions pages.
 *
 * Statuses supported:
 *   Invoice:  ISSUED · PAID · VOID · REFUNDED (overdue is derived)
 *   Lab:      PENDING · IN_PROGRESS · COMPLETED · CANCELLED
 *   General:  ACTIVE · INACTIVE
 *   Appointment: REQUESTED · CONFIRMED · COMPLETED · CANCELLED · NO_SHOW
 * ─────────────────────────────────────────────────────────────────
 */

const STATUS_MAP = {
  // ── Payment statuses ──────────────────────────
  PENDING:     { label: 'Pending',     className: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  PAID:        { label: 'Paid',        className: 'bg-teal-500/15   text-teal-400   border-teal-500/20'   },
  CANCELLED:   { label: 'Cancelled',   className: 'bg-red-500/15    text-red-400    border-red-500/20'    },
  OVERDUE:     { label: 'Overdue',     className: 'bg-rose-500/15   text-rose-400   border-rose-500/20'   },
  // ── Lab / request statuses ────────────────────
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
  COMPLETED:   { label: 'Completed',   className: 'bg-teal-500/15   text-teal-400   border-teal-500/20'   },
  // ── Generic ───────────────────────────────────
  ACTIVE:      { label: 'Active',      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  INACTIVE:    { label: 'Inactive',    className: 'bg-slate-500/15  text-slate-400  border-slate-500/20'  },
  // ── Invoice lifecycle ─────────────────────────
  ISSUED:      { label: 'Issued',      className: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  VOID:        { label: 'Void',        className: 'bg-slate-500/15  text-slate-400  border-slate-500/20'  },
  REFUNDED:    { label: 'Refunded',    className: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
  // ── Appointment lifecycle ─────────────────────
  REQUESTED:   { label: 'Requested',   className: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  CONFIRMED:   { label: 'Confirmed',   className: 'bg-teal-500/15   text-teal-400   border-teal-500/20'   },
  NO_SHOW:     { label: 'No show',     className: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
}

/**
 * @param {{ status: string, className?: string }} props
 */
export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_MAP[status] || {
    label: status,
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  text-xs font-semibold border
                  ${config.className} ${className}`}
    >
      {/* Status dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 flex-shrink-0" />
      {config.label}
    </span>
  )
}
