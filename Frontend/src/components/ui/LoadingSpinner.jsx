/**
 * Loading states.
 *
 * A skeleton is preferred to a spinner nearly everywhere, because a skeleton
 * says what is about to arrive and a spinner only says "wait". The exception is
 * a whole page that has nothing to sketch yet.
 */

/**
 * A placeholder block.
 *
 * The sweep is a real animation now: the previous version set
 * `animation: shimmer 1.5s infinite` inline against a keyframe that had never
 * been defined, which overrode the pulse it also carried and left every
 * skeleton in the product perfectly still.
 */
export function Skeleton({ className = '', ...rest }) {
  return (
    <span
      aria-hidden="true"
      className={`sweeping block animate-sweep rounded-sm ${className}`}
      {...rest}
    />
  )
}

/**
 * A line of text that has not arrived. Sized in `ch` so a placeholder for a
 * name is the width of a name.
 */
export function SkeletonText({ chars = 18, className = '' }) {
  return <Skeleton className={`h-3.5 ${className}`} style={{ width: `${chars}ch` }} />
}

/**
 * Rows waiting on a list. Matches the row rhythm used across the product so
 * nothing jumps when the data lands.
 */
export function SkeletonRows({ rows = 3, label = 'Loading' }) {
  return (
    <ul className="divide-y divide-hairline" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-4 w-12" />
          <div className="flex-1 space-y-2">
            <SkeletonText chars={22} />
            <SkeletonText chars={14} className="opacity-60" />
          </div>
          <Skeleton className="h-5 w-20" />
        </li>
      ))}
    </ul>
  )
}

/**
 * The whole page is still resolving. Used only where there is no shape to
 * sketch — the session check, and a route that has not loaded yet.
 */
export function PageSpinner({ label = 'Loading' }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      role="status"
    >
      <Spinner size={20} className="text-teal-400" />
      <p className="text-meta text-slate-500">{label}</p>
    </div>
  )
}

/** An inline spinner, for a button that is working. */
export function Spinner({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
