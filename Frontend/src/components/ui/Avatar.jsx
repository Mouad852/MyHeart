/**
 * Avatar.jsx — a person's initials.
 *
 * One treatment, not six. The previous version picked a background from a
 * palette of six colours keyed off the first character of the name, which meant
 * a patient list rendered as a column of teal, violet, amber and rose discs
 * carrying no information at all — the colour said nothing about the person, and
 * it spent the same visual budget the status column needs to do its job.
 *
 * The initials themselves already distinguish people. The disc only has to hold
 * them.
 */
import { getInitials } from '../../utils'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-meta',
  lg: 'h-12 w-12 text-base',
}

export default function Avatar({ name = '', size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      title={name || undefined}
      className={`inline-flex flex-shrink-0 select-none items-center justify-center
                  rounded-full bg-white/[0.06] font-medium tracking-wide text-slate-400
                  ring-1 ring-inset ring-white/[0.07]
                  ${SIZES[size] || SIZES.md} ${className}`}
    >
      {getInitials(name) || '—'}
    </span>
  )
}
