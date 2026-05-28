import { useRef, useEffect, useState } from 'react'

interface Shot {
  loc_x: number
  loc_y: number
  shot_made: boolean
  shot_type: string
  shot_distance: number
  period: number
}

interface Props {
  shots: Shot[]
  width?: number
  height?: number
}

// NBA court dimensions in tenths of a foot (nba_api coordinate system)
// LOC_X: -250 to 250 (left to right), LOC_Y: -52 to 900 (baseline to halfcourt)
const COURT = {
  width: 500,
  height: 470,   // show full offensive half
}

function courtToCanvas(x: number, y: number, cw: number, ch: number) {
  const scaleX = cw / COURT.width
  const scaleY = ch / COURT.height
  return {
    cx: (x + 250) * scaleX,
    cy: (y + 52) * scaleY,
  }
}

function drawCourt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const scaleX = w / COURT.width
  const scaleY = h / COURT.height

  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, w, h)

  function c(x: number, y: number) {
    return { x: (x + 250) * scaleX, y: (y + 52) * scaleY }
  }

  // Baseline
  const bl = c(-250, -52), br = c(250, -52)
  ctx.beginPath()
  ctx.moveTo(bl.x, bl.y)
  ctx.lineTo(br.x, br.y)
  ctx.stroke()

  // Sidelines (partial — up to visible area)
  ctx.beginPath()
  ctx.moveTo(bl.x, bl.y); ctx.lineTo(bl.x, h); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(br.x, br.y); ctx.lineTo(br.x, h); ctx.stroke()

  // Paint / key
  const paintL = c(-80, -52), paintR = c(80, -52)
  const paintTop = c(-80, 190), paintTopR = c(80, 190)
  ctx.beginPath()
  ctx.rect(paintL.x, paintL.y, (paintR.x - paintL.x), (paintTop.y - paintL.y))
  ctx.stroke()

  // Free throw lane
  ctx.beginPath()
  ctx.rect(paintL.x, paintTop.y - (60 * scaleY), (paintR.x - paintL.x), 60 * scaleY)
  ctx.stroke()

  // Free throw circle
  const ftCenter = c(0, 190)
  ctx.beginPath()
  ctx.arc(ftCenter.x, ftCenter.y, 60 * scaleX, 0, Math.PI * 2)
  ctx.stroke()

  // Restricted area circle (4ft radius = 48 tenths)
  const basket = c(0, 0)
  ctx.beginPath()
  ctx.arc(basket.x, basket.y, 48 * scaleX, 0, Math.PI)
  ctx.stroke()

  // Basket
  ctx.beginPath()
  ctx.arc(basket.x, basket.y, 7.5 * scaleX, 0, Math.PI * 2)
  ctx.strokeStyle = '#6B7280'
  ctx.stroke()

  // Backboard
  const bbL = c(-30, -7.5), bbR = c(30, -7.5)
  ctx.beginPath()
  ctx.moveTo(bbL.x, bbL.y)
  ctx.lineTo(bbR.x, bbR.y)
  ctx.strokeStyle = '#6B7280'
  ctx.stroke()

  ctx.strokeStyle = '#374151'

  // Three-point arc
  ctx.beginPath()
  // Corner threes (straight lines at x=±220, from baseline to y=89)
  const c3L = c(-220, -52), c3LTop = c(-220, 89)
  ctx.moveTo(c3L.x, c3L.y)
  ctx.lineTo(c3LTop.x, c3LTop.y)
  ctx.stroke()

  const c3R = c(220, -52), c3RTop = c(220, 89)
  ctx.beginPath()
  ctx.moveTo(c3R.x, c3R.y)
  ctx.lineTo(c3RTop.x, c3RTop.y)
  ctx.stroke()

  // Arc (radius ~237.5 from basket)
  const arcRadius = 237.5 * scaleX
  const startAngle = Math.atan2((c3LTop.y - basket.y), (c3LTop.x - basket.x))
  const endAngle = Math.atan2((c3RTop.y - basket.y), (c3RTop.x - basket.x))
  ctx.beginPath()
  ctx.arc(basket.x, basket.y, arcRadius, startAngle, endAngle)
  ctx.stroke()
}

function drawShots(ctx: CanvasRenderingContext2D, shots: Shot[], w: number, h: number) {
  for (const shot of shots) {
    const { cx, cy } = courtToCanvas(shot.loc_x, shot.loc_y, w, h)
    const r = 3

    if (shot.shot_made) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(74, 222, 128, 0.75)'  // green
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(cx - r, cy - r)
      ctx.lineTo(cx + r, cy + r)
      ctx.moveTo(cx + r, cy - r)
      ctx.lineTo(cx - r, cy + r)
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)'  // red
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }
}

export function ShotChart({ shots, width = 500, height = 470 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovered, setHovered] = useState<Shot | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    drawCourt(ctx, width, height)
    drawShots(ctx, shots, width, height)
  }, [shots, width, height])

  const made = shots.filter((s) => s.shot_made).length
  const pct = shots.length > 0 ? ((made / shots.length) * 100).toFixed(1) : '—'

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="rounded-lg w-full"
        style={{ maxWidth: width, display: 'block', margin: '0 auto' }}
      />
      <div className="flex justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400/75" />
          Made ({made})
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-400/75 font-bold text-sm leading-none">×</span>
          Missed ({shots.length - made})
        </span>
        <span className="text-gray-400">FG% {pct}%</span>
      </div>
    </div>
  )
}
