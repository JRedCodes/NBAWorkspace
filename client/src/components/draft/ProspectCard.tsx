import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface Prospect {
  id: string
  name: string
  position: string
  school: string
  height_inches: number | null
  weight_lbs: number | null
  wingspan_inches: number | null
  projected_pick: number | null
  overall_model_score: number | null
  shooting_score: number | null
  size_score: number | null
  upside_score: number | null
  defense_score: number | null
  custom_rank?: number
  model_rank?: number
  user_notes?: string
}

interface Props {
  prospect: Prospect
  rank: number
  isDraggable?: boolean
  isModel?: boolean
  dimmed?: boolean
}

function ScoreDot({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-600">—</span>
  const color =
    value >= 75 ? 'text-green-400' :
    value >= 50 ? 'text-blue-400' :
    value >= 30 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`${color} font-medium`}>{Math.round(value)}</span>
}

function heightDisplay(inches: number | null) {
  if (!inches) return '—'
  const ft = Math.floor(inches / 12)
  const inn = inches % 12
  return `${ft}'${inn}"`
}

export function ProspectCard({ prospect, rank, isDraggable = false, isModel = false, dimmed = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
    disabled: !isDraggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : dimmed ? 0.45 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
        isModel
          ? 'border-transparent bg-gray-800/40'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      } ${isDragging ? 'shadow-lg shadow-black/50 z-50' : ''}`}
    >
      {isDraggable && (
        <span
          {...attributes}
          {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing text-sm select-none shrink-0"
        >
          ⠿
        </span>
      )}

      <span className={`text-xs font-mono w-6 text-right shrink-0 ${isModel ? 'text-gray-600' : 'text-gray-400'}`}>
        {rank}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{prospect.name}</p>
        <p className="text-xs text-gray-500">
          {prospect.position || '—'} · {prospect.school || '—'}
          {prospect.height_inches ? ` · ${heightDisplay(prospect.height_inches)}` : ''}
        </p>
      </div>

      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-xs">
          <ScoreDot value={prospect.overall_model_score} />
        </div>
      </div>
    </div>
  )
}
