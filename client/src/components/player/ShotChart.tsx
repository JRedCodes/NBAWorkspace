import { useRef, useEffect } from 'react'

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

// nba_api coordinate space:
//   LOC_X: -250 (left) to 250 (right)  — 500 units wide
//   LOC_Y: -52 (baseline) to ~420 (half court)  — 472 units tall
// We display with the BASKET at the bottom (standard broadcast view)

const COURT_W = 500
const COURT_H = 470

function toCanvas(x: number, y: number, cw: number, ch: number) {
  const sx = cw / COURT_W
  const sy = ch / COURT_H
  return {
    cx: (x + 250) * sx,
    // Flip Y: baseline at bottom, half-court at top
    cy: ch - (y + 52) * sy,
  }
}

function drawCourt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sx = w / COURT_W
  const sy = h / COURT_H

  // Background
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, w, h)

  // Helper
  function pt(x: number, y: number) {
    return toCanvas(x, y, w, h)
  }

  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#64748b'

  // Baseline (bottom)
  ctx.beginPath()
  const bl = pt(-250, -52)
  const br = pt(250, -52)
  ctx.moveTo(bl.cx, bl.cy)
  ctx.lineTo(br.cx, br.cy)
  ctx.stroke()

  // Sidelines
  ctx.beginPath()
  ctx.moveTo(bl.cx, bl.cy)
  ctx.lineTo(bl.cx, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(br.cx, br.cy)
  ctx.lineTo(br.cx, 0)
  ctx.stroke()

  // Paint (key box)
  const pL = pt(-80, -52)
  const pR = pt(80, -52)
  const pTop = pt(80, 190)
  ctx.strokeRect(pL.cx, pTop.cy, pR.cx - pL.cx, pL.cy - pTop.cy)

  // Free-throw circle (top half only)
  const ftC = pt(0, 190)
  ctx.beginPath()
  ctx.arc(ftC.cx, ftC.cy, 60 * sx, 0, Math.PI, false) // top half — opens toward halfcourt
  ctx.stroke()
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(ftC.cx, ftC.cy, 60 * sx, 0, Math.PI, true)  // dashed bottom half
  ctx.stroke()
  ctx.setLineDash([])

  // Restricted area arc (48 units radius = 4ft)
  const basket = pt(0, 0)
  ctx.beginPath()
  ctx.arc(basket.cx, basket.cy, 48 * sx, Math.PI, 0, false) // opens upward
  ctx.stroke()

  // Backboard
  const bbL = pt(-30, -7.5)
  const bbR = pt(30, -7.5)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#94a3b8'
  ctx.beginPath()
  ctx.moveTo(bbL.cx, bbL.cy)
  ctx.lineTo(bbR.cx, bbR.cy)
  ctx.stroke()

  // Basket
  ctx.beginPath()
  ctx.arc(basket.cx, basket.cy, 7.5 * sx, 0, Math.PI * 2)
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 1.5

  // Corner three — left vertical
  const c3BL = pt(-220, -52)
  const c3TL = pt(-220, 89)
  ctx.beginPath()
  ctx.moveTo(c3BL.cx, c3BL.cy)
  ctx.lineTo(c3TL.cx, c3TL.cy)
  ctx.stroke()

  // Corner three — right vertical
  const c3BR = pt(220, -52)
  const c3TR = pt(220, 89)
  ctx.beginPath()
  ctx.moveTo(c3BR.cx, c3BR.cy)
  ctx.lineTo(c3TR.cx, c3TR.cy)
  ctx.stroke()

  // Three-point arc (237.5 unit radius from basket)
  // Arc goes from right corner (c3TR) counterclockwise to left corner (c3TL)
  // = the short arc that curves AWAY from the basket (upward on flipped canvas)
  const arcR = 237.5 * sx
  const aRight = Math.atan2(c3TR.cy - basket.cy, c3TR.cx - basket.cx)
  const aLeft  = Math.atan2(c3TL.cy - basket.cy, c3TL.cx - basket.cx)
  ctx.beginPath()
  ctx.arc(basket.cx, basket.cy, arcR, aRight, aLeft, true) // anticlockwise = short arc upward
  ctx.stroke()

  // Half-court line
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = '#334155'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w, 0)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawShots(ctx: CanvasRenderingContext2D, shots: Shot[], w: number, h: number) {
  for (const shot of shots) {
    const { cx, cy } = toCanvas(shot.loc_x, shot.loc_y, w, h)
    const r = 3.5

    if (shot.shot_made) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(74, 222, 128, 0.8)'
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r)
      ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r)
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.65)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

export function ShotChart({ shots, width = 500, height = 470 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
        className="rounded-lg w-full block mx-auto"
        style={{ maxWidth: width }}
      />
      <div className="flex justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80 inline-block" />
          Made ({made})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-red-400/80 font-bold text-sm leading-none">×</span>
          Missed ({shots.length - made})
        </span>
        <span className="font-medium text-gray-400">FG% {pct}%</span>
      </div>
    </div>
  )
}
