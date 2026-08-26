/**
 * Panel.jsx — the only container in the product.
 *
 * A panel is a hairline and a slightly lifted ground. It does not float, it
 * does not cast a shadow, and it is never nested inside another panel: if a
 * region inside a panel needs separating, it gets a rule, not a second box.
 *
 * `bleed` exists because most panels hold a list. A list wants to run edge to
 * edge so its own row rules meet the panel border, while a panel holding prose
 * wants padding. Making that a prop rather than a judgement call each time is
 * what keeps twelve screens looking like one product.
 */

export function Panel({ children, className = '', as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`panel ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * A panel's header strip: what this region is, and the one control that acts
 * on the whole region.
 */
export function PanelHead({ title, description, action, count, className = '' }) {
  return (
    <header
      className={`flex flex-wrap items-start justify-between gap-x-6 gap-y-3
                  border-b border-rule px-5 py-4 ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {count != null && (
            <span className="ident text-meta text-ink-3">{count}</span>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-[58ch] text-meta text-ink-3">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}

/** Padding for a panel holding prose or a form rather than a list. */
export function PanelBody({ children, className = '' }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>
}

/**
 * A labelled value — the unit a clinical record is actually made of.
 * Label above, value below, both left-aligned to the same edge so a column of
 * them reads as a form even without any box around it.
 */
export function Field({ label, children, mono = false, className = '' }) {
  return (
    <div className={className}>
      <dt className="section-label">{label}</dt>
      <dd className={`mt-1.5 text-sm text-ink ${mono ? 'ident' : ''}`}>
        {children ?? <span className="text-ink-3">—</span>}
      </dd>
    </div>
  )
}
