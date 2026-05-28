import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { draftService } from '../services/draft.service'

export const draftKeys = {
  prospects: (filters?: Record<string, string>) => ['draft', 'prospects', filters] as const,
  prospect: (id: string) => ['draft', 'prospects', id] as const,
  order: ['draft', 'order'] as const,
  boards: ['draft', 'boards'] as const,
  board: (id: string) => ['draft', 'boards', id] as const,
}

export function useProspects(filters?: Record<string, string>) {
  return useQuery({
    queryKey: draftKeys.prospects(filters),
    queryFn: () => draftService.getProspects(filters).then((r) => r.data),
  })
}

export function useDraftOrder() {
  return useQuery({
    queryKey: draftKeys.order,
    queryFn: () => draftService.getDraftOrder().then((r) => r.data),
  })
}

export function useDraftBoards() {
  return useQuery({
    queryKey: draftKeys.boards,
    queryFn: () => draftService.getBoards().then((r) => r.data),
  })
}

export function useDraftBoard(id: string) {
  return useQuery({
    queryKey: draftKeys.board(id),
    queryFn: () => draftService.getBoard(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name?: string) => draftService.createBoard(name).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: draftKeys.boards }),
  })
}

export function useReplaceRankings(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rankings: { prospectId: string; rank: number }[]) =>
      draftService.replaceRankings(boardId, rankings),
    onSuccess: () => qc.invalidateQueries({ queryKey: draftKeys.board(boardId) }),
  })
}

export function useDeleteBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => draftService.deleteBoard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: draftKeys.boards }),
  })
}
