import { create } from 'zustand'

interface TradeState {
  activeScenarioId: string | null
  isProjectionStale: boolean
  setActiveScenario: (id: string | null) => void
  markProjectionStale: () => void
  markProjectionFresh: () => void
}

export const useTradeStore = create<TradeState>()((set) => ({
  activeScenarioId: null,
  isProjectionStale: false,
  setActiveScenario: (id) => set({ activeScenarioId: id }),
  markProjectionStale: () => set({ isProjectionStale: true }),
  markProjectionFresh: () => set({ isProjectionStale: false }),
}))
