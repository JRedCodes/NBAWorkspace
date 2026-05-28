import { create } from 'zustand'

export interface TradeLeg {
  playerId: string
  playerName: string
  salary: number
  fromTeamId: string
  fromTeamName: string
  toTeamId: string
  toTeamName: string
}

export interface PickLeg {
  pickId: string
  label: string
  fromTeamId: string
  toTeamId: string
}

interface TradeState {
  players: TradeLeg[]
  picks: PickLeg[]
  activeScenarioId: string | null
  isProjectionStale: boolean

  addPlayer: (leg: TradeLeg) => void
  removePlayer: (playerId: string) => void
  addPick: (leg: PickLeg) => void
  removePick: (pickId: string) => void
  clearTrade: () => void
  setActiveScenario: (id: string | null) => void
  markProjectionStale: () => void
  markProjectionFresh: () => void
}

export const useTradeStore = create<TradeState>()((set) => ({
  players: [],
  picks: [],
  activeScenarioId: null,
  isProjectionStale: false,

  addPlayer: (leg) =>
    set((s) => ({
      players: s.players.find((p) => p.playerId === leg.playerId)
        ? s.players
        : [...s.players, leg],
      isProjectionStale: true,
    })),

  removePlayer: (playerId) =>
    set((s) => ({
      players: s.players.filter((p) => p.playerId !== playerId),
      isProjectionStale: true,
    })),

  addPick: (leg) =>
    set((s) => ({
      picks: s.picks.find((p) => p.pickId === leg.pickId) ? s.picks : [...s.picks, leg],
      isProjectionStale: true,
    })),

  removePick: (pickId) =>
    set((s) => ({
      picks: s.picks.filter((p) => p.pickId !== pickId),
      isProjectionStale: true,
    })),

  clearTrade: () => set({ players: [], picks: [], isProjectionStale: false }),

  setActiveScenario: (id) => set({ activeScenarioId: id }),

  markProjectionStale: () => set({ isProjectionStale: true }),
  markProjectionFresh: () => set({ isProjectionStale: false }),
}))
