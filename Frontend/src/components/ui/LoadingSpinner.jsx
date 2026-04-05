/**
 * LoadingSpinner.jsx — Reusable loading states.
 */

/** Full-page centered spinner */
export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 rounded-full border-2 border-t-teal-400 animate-spin" />
      </div>
      <p className="text-sm text-slate-500 animate-pulse-subtle">Loading…</p>
    </div>
  )
}

/** Inline small spinner */
export function Spinner({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Skeleton shimmer block */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5
                  bg-[length:200%_100%] rounded-xl ${className}`}
      style={{ animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }}
    />
  )
}
