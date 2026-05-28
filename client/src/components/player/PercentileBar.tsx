interface Props {
  label: string
  value: number | null | undefined
  completeness?: 'full' | 'partial' | 'limited'
}

export function PercentileBar({ label, value, completeness }: Props) {
  const pct = value ?? 50
  const color =
    pct >= 75 ? 'bg-green-500' :
    pct >= 50 ? 'bg-blue-500' :
    pct >= 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-white">{Math.round(pct)}</span>
          {completeness && completeness !== 'full' && (
            <span className="text-xs text-yellow-500" title={completeness === 'partial' ? 'Limited data' : 'Estimated'}>
              {completeness === 'partial' ? '~' : '≈'}
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
