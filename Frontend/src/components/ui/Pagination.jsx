/**
 * Pagination.jsx — page controls for server-paged lists.
 *
 * Deliberately plain: previous, next, and where you are. Numbered page links
 * are noise on a list somebody scans rather than navigates.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * @param {{
 *   page: number, totalPages: number, totalElements: number,
 *   size: number, first: boolean, last: boolean,
 *   onChange: (page: number) => void
 * }} props
 */
export default function Pagination({
  page = 0,
  totalPages = 0,
  totalElements = 0,
  size = 20,
  first = true,
  last = true,
  onChange,
}) {
  // One page of results does not need controls.
  if (totalPages <= 1) return null

  const from = page * size + 1
  const to = Math.min((page + 1) * size, totalElements)

  const buttonClass = `inline-flex items-center gap-1.5 rounded-lg border border-white/10
     px-3 py-1.5 text-xs font-medium text-slate-300
     transition-colors duration-150
     hover:border-teal-500/40 hover:text-teal-400
     focus:outline-none focus:ring-2 focus:ring-teal-400
     focus:ring-offset-2 focus:ring-offset-navy-900
     disabled:cursor-not-allowed disabled:opacity-40
     disabled:hover:border-white/10 disabled:hover:text-slate-300`

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 px-6 py-4"
      aria-label="Pagination"
    >
      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300">{from}</span> to{' '}
        <span className="text-slate-300">{to}</span> of{' '}
        <span className="text-slate-300">{totalElements}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(page - 1)}
          disabled={first}
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
          Previous
        </button>

        <span className="px-2 text-xs text-slate-500" aria-current="page">
          Page {page + 1} of {totalPages}
        </span>

        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(page + 1)}
          disabled={last}
        >
          Next
          <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
