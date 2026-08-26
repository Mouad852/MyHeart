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

  const buttonClass = 'btn-row'

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-4 border-t border-rule px-5 py-3"
      aria-label="Pagination"
    >
      <p className="text-meta text-ink-3">
        Showing <span className="ident text-ink-2">{from}</span> to{' '}
        <span className="ident text-ink-2">{to}</span> of{' '}
        <span className="ident text-ink-2">{totalElements}</span>
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

        <span className="px-2 text-meta text-ink-3" aria-current="page">
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
