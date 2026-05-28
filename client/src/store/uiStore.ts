import { create } from 'zustand'

interface UIState {
  activeTeamId: string | null
  isCarouselPlaying: boolean
  openModal: string | null
  setActiveTeam: (id: string | null) => void
  toggleCarousel: () => void
  openModalById: (id: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeTeamId: null,
  isCarouselPlaying: true,
  openModal: null,
  setActiveTeam: (id) => set({ activeTeamId: id }),
  toggleCarousel: () => set((s) => ({ isCarouselPlaying: !s.isCarouselPlaying })),
  openModalById: (id) => set({ openModal: id }),
  closeModal: () => set({ openModal: null }),
}))
