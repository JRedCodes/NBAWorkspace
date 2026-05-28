import api from '../lib/api'

export const draftService = {
  getProspects: (params?: Record<string, string>) => api.get('/draft/prospects', { params }),
  getProspect: (id: string) => api.get(`/draft/prospects/${id}`),
  getDraftOrder: () => api.get('/draft/order'),
  getBoards: () => api.get('/draft/boards'),
  getBoard: (id: string) => api.get(`/draft/boards/${id}`),
  createBoard: (name?: string) => api.post('/draft/boards', { name }),
  renameBoard: (id: string, name: string) => api.patch(`/draft/boards/${id}`, { name }),
  replaceRankings: (id: string, rankings: { prospectId: string; rank: number }[]) =>
    api.put(`/draft/boards/${id}/rankings`, { rankings }),
  updateEntry: (boardId: string, prospectId: string, data: { custom_rank?: number; user_notes?: string }) =>
    api.patch(`/draft/boards/${boardId}/prospects/${prospectId}`, data),
  resetBoard: (id: string) => api.post(`/draft/boards/${id}/reset`),
  deleteBoard: (id: string) => api.delete(`/draft/boards/${id}`),
}
