/**
 * EmptyState.jsx — Shown when a list has no items.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10
                        flex items-center justify-center mb-2">
          <Icon size={28} className="text-slate-500" />
        </div>
      )}
      <div>
        <h3 className="font-display text-lg font-semibold text-slate-300 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
