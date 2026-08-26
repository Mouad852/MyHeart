/**
 * Menu.jsx — the actions on a row that are not the obvious one.
 *
 * A list of thirty appointments used to carry thirty red Cancel buttons, one
 * per row, in a column down the right-hand side. Three things were wrong with
 * that: the most destructive action in the product was the easiest one to hit,
 * it was the *only* action offered even where the server would have accepted
 * three others, and a column of red on a screen where nothing was wrong taught
 * people to stop seeing red.
 *
 * So: the action a row is actually waiting for stays inline, and everything
 * else lives behind one quiet control. Destructive items are marked, and sit
 * last, under a rule.
 */
import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

/**
 * @param {{
 *   label: string,
 *   items: Array<{
 *     label: string, icon?: any, onSelect: () => void,
 *     danger?: boolean, disabled?: boolean
 *   }>
 * }} props
 */
export default function Menu({ label = 'More actions', items = [], align = 'right' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const usable = items.filter(Boolean)
  if (usable.length === 0) return null

  const safe = usable.filter((item) => !item.danger)
  const destructive = usable.filter((item) => item.danger)

  const renderItem = (item) => {
    const Icon = item.icon
    return (
      <button
        key={item.label}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={() => {
          setOpen(false)
          item.onSelect()
        }}
        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm
                    transition-colors duration-fast disabled:pointer-events-none
                    disabled:opacity-40
                    ${
                      item.danger
                        ? 'text-rose-300 hover:bg-rose-500/10'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
      >
        {Icon && <Icon size={13} strokeWidth={2} aria-hidden="true" />}
        {item.label}
      </button>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`btn-icon h-7 w-7 ${open ? 'bg-white/[0.06] text-white' : ''}`}
      >
        <MoreHorizontal size={15} strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+4px)] z-50 min-w-[11rem] animate-fade-in
                      overflow-hidden rounded border border-rule bg-navy-850 py-1
                      shadow-overlay ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {safe.map(renderItem)}
          {destructive.length > 0 && safe.length > 0 && (
            <div className="my-1 border-t border-hairline" />
          )}
          {destructive.map(renderItem)}
        </div>
      )}
    </div>
  )
}
