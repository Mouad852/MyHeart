/**
 * StatsCard.jsx — Metric card shown on the dashboard.
 */
export default function StatsCard({ icon: Icon, label, value, color = 'teal', isLoading }) {
  const colorMap = {
    teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   icon: 'text-teal-400'   },
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400'   },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400' },
    amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: 'text-amber-400'  },
  }
  const c = colorMap[color] || colorMap.teal

  return (
    <div className="card p-6 flex items-center gap-5 hover:shadow-card-hover transition-shadow duration-300">
      <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border}
                       flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        {isLoading ? (
          <div className="h-7 w-12 bg-white/10 rounded-lg animate-pulse" />
        ) : (
          <p className="font-display text-2xl font-bold text-white">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}
