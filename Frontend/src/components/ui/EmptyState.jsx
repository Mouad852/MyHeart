/**
 * EmptyState.jsx — a list with nothing in it.
 *
 * Two kinds, because empty means two different things.
 *
 *   `nothing-yet` — the ordinary case. No records exist. Say what would put a
 *   record here, and offer the action that does it.
 *
 *   `good` — empty is the correct outcome. An empty confirmation queue means
 *   the desk is on top of its work; drawing a large grey icon over it makes
 *   success look like failure.
 *
 * There is no icon in a box. A 64px grey square containing a grey glyph is the
 * most reliable sign in a dark interface that nobody decided anything.
 */
import { Check } from 'lucide-react'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'nothing-yet',
  className = '',
}) {
  if (tone === 'good') {
    return (
      <div className={`flex items-center gap-3 px-5 py-6 ${className}`}>
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full
                     bg-teal-400/10 text-teal-400"
          aria-hidden="true"
        >
          <Check size={12} strokeWidth={2.5} />
        </span>
        <p className="text-sm text-slate-300">
          {title}
          {description && <span className="text-slate-500"> {description}</span>}
        </p>
      </div>
    )
  }

  return (
    <div className={`px-5 py-14 text-center ${className}`}>
      {Icon && (
        <Icon
          size={20}
          strokeWidth={1.5}
          className="mx-auto mb-4 text-slate-500"
          aria-hidden="true"
        />
      )}
      <p className="text-base font-medium text-slate-300">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-[46ch] text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
