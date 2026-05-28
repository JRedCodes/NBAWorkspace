import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ProspectCard, type Prospect } from '../../components/draft/ProspectCard'
import { useProspects, useDraftBoards, useDraftBoard, useCreateBoard, useReplaceRankings } from '../../hooks/useDraft'

function ScoreHeader({ label, short }: { label: string; short: string }) {
  return (
    <span title={label} className="text-xs text-gray-500 cursor-help">{short}</span>
  )
}

export default function DraftBoard() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // prevents accidental drags on click
    }),
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

  // Auto-select first board or create one
  useEffect(() => {
    const boardList = boards as { id: string; name: string }[]
    if (boardList.length > 0 && !activeBoardId) {
      setActiveBoardId(boardList[0].id)
    }
  }, [boards, activeBoardId])

  // Sync board entries to local state
  useEffect(() => {
    if (boardEntries.length > 0) {
      setLocalRankings(boardEntries as Prospect[])
      setIsDirty(false)
    }
  }, [boardEntries])

  // Model order (by overall_model_score desc)
  const modelOrder = [...(allProspects as Prospect[])].sort(
    (a, b) => (b.overall_model_score ?? 0) - (a.overall_model_score ?? 0),
  )

  const filtered = posFilter
    ? localRankings.filter((p) => p.position === posFilter)
    : localRankings

  function handleDragStart(event: { active: { id: string | number } }) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalRankings((items) => {
      const oldIdx = items.findIndex((p) => p.id === active.id)
      const newIdx = items.findIndex((p) => p.id === over.id)
      const moved = arrayMove(items, oldIdx, newIdx)
      return moved.map((p, i) => ({ ...p, custom_rank: i + 1 }))
    })
    setIsDirty(true)
  }

  async function handleSave() {
    const rankings = localRankings.map((p, i) => ({ prospectId: p.id, rank: i + 1 }))
    await saveRankings.mutateAsync(rankings)
    setIsDirty(false)
  }

  async function handleCreateBoard() {
    const board = await createBoard.mutateAsync(`My Board ${(boards as []).length + 1}`)
    setActiveBoardId((board as { id: string }).id)
  }

  const positions = [...new Set((allProspects as Prospect[]).map((p) => p.position).filter(Boolean))]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Draft Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">2026 Draft Class · {(allProspects as []).length} prospects · Combine measurements</p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saveRankings.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {saveRankings.isPending ? 'Saving…' : 'Save order'}
            </button>
          )}
          <select
            value={activeBoardId}
            onChange={(e) => setActiveBoardId(e.target.value)}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none"
          >
            {(boards as { id: string; name: string }[]).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button
            onClick={handleCreateBoard}
            disabled={createBoard.isPending}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            + New board
          </button>
        </div>
      </div>

      {/* Position filter */}
      <div className="flex gap-1">
        {['', ...positions].map((pos) => (
          <button
            key={pos || 'all'}
            onClick={() => setPosFilter(pos)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              posFilter === pos
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {pos || 'All'}
          </button>
        ))}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Column 1: User's custom board */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Board</h2>
            <span className="text-xs text-gray-500">grip (⠿) to drag</span>
          </div>
          {localRankings.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm border border-gray-700 border-dashed rounded-lg">
              Create a board to start ranking
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filtered.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {filtered.map((p, i) => (
                  <ProspectCard key={p.id} prospect={p} rank={i + 1} isDraggable />
                ))}
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

        {/* Column 2: Model projected board */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model Board</h2>
            <div className="flex gap-2 text-xs text-gray-600">
              <ScoreHeader label="Overall" short="OVR" />
            </div>
          </div>
          {modelOrder
            .filter((p) => !posFilter || p.position === posFilter)
            .map((p, i) => (
              <ProspectCard key={p.id} prospect={p} rank={i + 1} isModel />
            ))}
        </div>

        {/* Column 3: Draft order (pick slots) */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
            Pick Order
          </h2>
          {(allProspects as Prospect[])
            .filter((p) => !posFilter || p.position === posFilter)
            .sort((a, b) => (a.projected_pick ?? 999) - (b.projected_pick ?? 999))
            .map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded border border-transparent">
                <span className="text-xs font-mono text-gray-500 w-6 text-right shrink-0">
                  {p.projected_pick ?? i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{p.name}</p>
                  <p className="text-xs text-gray-600">{p.position} · {p.school}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
