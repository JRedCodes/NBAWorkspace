import { create } from 'zustand'

interface WorkspaceState {
  lastAccessedTeamId: string | null
  recentScenarioIds: string[]
  recentBoardIds: string[]
  setLastAccessedTeam: (id: string) => void
  addRecentScenario: (id: string) => void
  addRecentBoard: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  lastAccessedTeamId: null,
  recentScenarioIds: [],
  recentBoardIds: [],

  setLastAccessedTeam: (id) => set({ lastAccessedTeamId: id }),

  addRecentScenario: (id) =>
    set((s) => ({
      recentScenarioIds: [id, ...s.recentScenarioIds.filter((x) => x !== id)].slice(0, 10),
    })),

  addRecentBoard: (id) =>
    set((s) => ({
      recentBoardIds: [id, ...s.recentBoardIds.filter((x) => x !== id)].slice(0, 10),
    })),
}))
