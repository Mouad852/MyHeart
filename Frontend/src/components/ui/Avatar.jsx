/**
 * Avatar.jsx — Displays user initials in a colored circle.
 */
import { getInitials, getAvatarColor } from '../../utils'

export default function Avatar({ name = '', size = 'md' }) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }

  return (
    <div
      className={`${sizeMap[size] || sizeMap.md} ${getAvatarColor(name)}
                  rounded-full flex items-center justify-center
                  font-display font-semibold flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  )
}
