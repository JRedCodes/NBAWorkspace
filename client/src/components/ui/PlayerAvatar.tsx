import { useState } from 'react'

interface Props {
  nbaPlayerId: number | null | undefined
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE = {
  xs: { container: 'w-6 h-6',   text: 'text-[8px]',  img: 260 },
  sm: { container: 'w-8 h-8',   text: 'text-[10px]', img: 260 },
  md: { container: 'w-12 h-12', text: 'text-sm',      img: 260 },
  lg: { container: 'w-20 h-20', text: 'text-xl',      img: 260 },
  xl: { container: 'w-28 h-28', text: 'text-2xl',     img: 1040 },
}

function initials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function PlayerAvatar({ nbaPlayerId, name, size = 'md', className = '' }: Props) {
  const [errored, setErrored] = useState(false)
  const { container, text, img } = SIZE[size]

  const src = nbaPlayerId && !errored
    ? `https://cdn.nba.com/headshots/nba/latest/${img === 1040 ? '1040x760' : '260x190'}/${nbaPlayerId}.png`
    : null

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className={`${container} rounded-full object-cover object-top bg-gray-700 shrink-0 ${className}`}
      />
    )
  }

  // Initials fallback
  return (
    <div
      className={`${container} rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0 ${className}`}
      title={name}
    >
      <span className={`${text} font-semibold text-gray-400`}>{initials(name)}</span>
    </div>
  )
}
