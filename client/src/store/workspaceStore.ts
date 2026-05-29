import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TradeLeg {
  playerId: string
  playerName: string
  salary: number
  fromTeamId: string
  fromTeamName: string
  toTeamId: string
  toTeamName: string
}

export interface TradedPick {
  pickId: string
  pickNumber: number
  round: number
  draftYear: number
  fromTeamId: string
  fromTeamName: string
  fromTeamAbbr: string
  toTeamId: string
  toTeamName: string
  toTeamAbbr: string
}

export interface DraftAssignment {
  pickId: string
  pickNumber: number
  round: number
  teamId: string
  teamName: string
  abbreviation: string
  prospectId: string
  prospectName: string
  position: string
  school: string
}

interface WorkspaceState {
  // Trade
  tradeLegs: TradeLeg[]
  tradedPicks: TradedPick[]
  activeScenarioId: string | null

  // Draft simulation
  draftAssignments: DraftAssignment[]
  myTeamIds: string[]

  // Metadata
  lastModified: number | null

  // Trade actions
  setTradeLegs: (legs: TradeLeg[]) => void
  setTradedPicks: (picks: TradedPick[]) => void
  clearTrade: () => void
  setActiveScenario: (id: string | null) => void

  // Draft actions
  setDraftAssignment: (assignment: DraftAssignment) => void
  removeDraftAssignment: (pickId: string) => void
  setAllDraftAssignments: (assignments: DraftAssignment[]) => void
  clearDraft: () => void
  setMyTeamIds: (ids: string[]) => void

  // Full reset
  resetWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      tradeLegs: [],
      tradedPicks: [],
      activeScenarioId: null,
      draftAssignments: [],
      myTeamIds: [],
      lastModified: null,

      setTradeLegs: (legs) => set({ tradeLegs: legs, lastModified: Date.now() }),
      setTradedPicks: (picks) => set({ tradedPicks: picks, lastModified: Date.now() }),
      clearTrade: () => set({ tradeLegs: [], tradedPicks: [], activeScenarioId: null, lastModified: Date.now() }),
      setActiveScenario: (id) => set({ activeScenarioId: id }),

      setDraftAssignment: (assignment) =>
        set((s) => ({
          draftAssignments: [
            ...s.draftAssignments.filter((a) => a.pickId !== assignment.pickId),
            assignment,
          ],
          lastModified: Date.now(),
        })),

      removeDraftAssignment: (pickId) =>
        set((s) => ({
          draftAssignments: s.draftAssignments.filter((a) => a.pickId !== pickId),
          lastModified: Date.now(),
        })),

      setAllDraftAssignments: (assignments) =>
        set({ draftAssignments: assignments, lastModified: Date.now() }),

      clearDraft: () => set({ draftAssignments: [], lastModified: Date.now() }),

      setMyTeamIds: (ids) => set({ myTeamIds: ids }),

      resetWorkspace: () =>
        set({
          tradeLegs: [],
          tradedPicks: [],
          activeScenarioId: null,
          draftAssignments: [],
          myTeamIds: [],
          lastModified: null,
        }),
    }),
    {
      name: 'gm-intel-workspace',
    },
  ),
)
