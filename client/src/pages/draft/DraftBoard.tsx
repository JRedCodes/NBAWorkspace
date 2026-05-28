import { useState, useEffect } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { ProspectCard, type Prospect } from '../../components/draft/ProspectCard'
import {
  useProspects, useDraftBoards, useDraftBoard,
  useCreateBoard, useReplaceRankings, useResetBoard,
} from '../../hooks/useDraft'

function RoundSeparator({ round }: { round: number }) {
  return (
    <div className="flex items-center gap-2 py-1 my-0.5">
      <div className="flex-1 h-px bg-gray-700" />
      <span className="text-xs text-gray-600 shrink-0">End of Round {round}</span>
      <div className="flex-1 h-px bg-gray-700" />
    </div>
  )
}

export default function DraftBoard() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { data: allProspects = [] } = useProspects({ draftYear: '2026' })
  const { data: boards = [] } = useDraftBoards()
  const createBoard = useCreateBoard()
  const [activeBoardId, setActiveBoardId] = useState<string>('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localRankings, setLocalRankings] = useState<Prospect[]>([])
  const [posFilter, setPosFilter] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const { data: boardEntries = [] } = useDraftBoard(activeBoardId)
  const saveRankings = useReplaceRankings(activeBoardId)
  const resetBoard = useResetBoard()

  const prospect2026Ids = new Set((allProspects as Prospect[]).map((p) => p.id))
  const hasStaleBoardData = localRankings.length > 0 && localRankings.every((p) => !prospect2026Ids.has(p.id))

  const espnOrder = [...(allProspects as Prospect[])].sort(
    (a, b) => (a.projected_pick ?? 999) - (b.projected_pick ?? 999),
  )

  useEffect(() => {
    const list = boards as { id: string }[]
    if (list.length > 0 && !activeBoardId) setActiveBoardId(list[0].id)
  }, [boards, activeBoardId])

  useEffect(() => {
    if (boardEntries.length > 0) { setLocalRankings(boardEntries as Prospect[]); setIsDirty(false) }
  }, [boardEntries])

  const filtered = posFilter ? localRankings.filter((p) => p.position === posFilter) : localRankings
  const filteredEspn = posFilter ? espnOrder.filter((p) => p.position === posFilter) : espnOrder

  function handleDragStart(e: { active: { id: string | number } }) { setActiveId(String(e.active.id)) }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLocalRankings((items) => {
      const moved = arrayMove(items, items.findIndex((p) => p.id === active.id), items.findIndex((p) => p.id === over.id))
      return moved.map((p, i) => ({ ...p, custom_rank: i + 1 }))
    })
    setIsDirty(true)
  }

  async function handleSave() {
    await saveRankings.mutateAsync(localRankings.map((p, i) => ({ prospectId: p.id, rank: i + 1 })))
    setIsDirty(false)
  }

  const positions = [...new Set((allProspects as Prospect[]).map((p) => p.position).filter(Boolean))].sort()

  function withSeparators(prospects: Prospect[], usePickForSep: boolean) {
    const items: React.ReactNode[] = []
    let r1 = false; let r2 = false
    prospects.forEach((p, i) => {
      const rank = usePickForSep ? (p.projected_pick ?? i + 1) : i + 1
      if (!r1 && rank > 30) { items.push(<RoundSeparator key="sep1" round={1} />); r1 = true }
      if (!r2 && rank > 60) { items.push(<RoundSeparator key="sep2" round={2} />); r2 = true }
      items.push(
        <ProspectCard
          key={p.id} prospect={p}
          rank={usePickForSep ? (p.projected_pick ?? i + 1) : i + 1}
          isDraggable={!usePickForSep}
          dimmed={(usePickForSep ? (p.projected_pick ?? 999) : i + 1) > 60}
        />,
      )
    })
    return items
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Draft Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">2026 Draft Class · {(allProspects as []).length} prospects</p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button onClick={handleSave} disabled={saveRankings.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded">
              {saveRankings.isPending ? 'Saving…' : 'Save order'}
            </button>
          )}
          <select value={activeBoardId} onChange={(e) => setActiveBoardId(e.target.value)}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none">
            {(boards as { id: string; name: string }[]).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button onClick={async () => { const b = await createBoard.mutateAsync(`My Board ${(boards as []).length + 1}`); setActiveBoardId((b as { id: string }).id) }}
            disabled={createBoard.isPending}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
            + New board
          </button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['', ...positions].map((pos) => (
          <button key={pos || 'all'} onClick={() => setPosFilter(pos)}
            className={`px-2.5 py-1 text-xs rounded ${posFilter === pos ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {pos || 'All'}
          </button>
        ))}
      </div>

      {hasStaleBoardData && (
        <div className="flex items-center justify-between px-3 py-2 bg-yellow-950/50 border border-yellow-700 rounded-lg text-xs">
          <span className="text-yellow-400">This board has entries from a previous draft class</span>
          <button onClick={() => resetBoard.mutate(activeBoardId)} disabled={resetBoard.isPending}
            className="text-yellow-300 hover:text-white font-medium disabled:opacity-50 ml-2">
            {resetBoard.isPending ? 'Resetting…' : 'Reset to 2026 class'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">My Board</h2>
            <span className="text-xs text-gray-500">⠿ grip to drag</span>
          </div>
          {localRankings.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm border border-gray-700 border-dashed rounded-lg">
              Create a board to start ranking
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">{withSeparators(filtered, false)}</div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <ProspectCard
                    prospect={localRankings.find((p) => p.id === activeId)!}
                    rank={localRankings.findIndex((p) => p.id === activeId) + 1}
                    isDraggable={false}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <div>
          <div className="px-1 mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ESPN 2026 Best Available</h2>
            <p className="text-xs text-gray-600 mt-0.5">Consensus ranking · not a mock draft order</p>
          </div>
          <div className="space-y-0.5">{withSeparators(filteredEspn, true)}</div>
        </div>
      </div>
    </div>
  )
}
