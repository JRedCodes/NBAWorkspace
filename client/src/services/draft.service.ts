// Phase 5
import api from '../lib/api'

export const draftService = {
  getProspects: (params?: Record<string, string>) => api.get('/draft/prospects', { params }),
  getProspect: (id: string) => api.get(`/draft/prospects/${id}`),
  getProspectFit: (prospectId: string, teamId: string) => api.get(`/draft/prospects/${prospectId}/fit/${teamId}`),
  getDraftOrder: () => api.get('/draft/order'),
  getBoards: () => api.get('/draft/boards'),
  getBoard: (id: string) => api.get(`/draft/boards/${id}`),
  createBoard: () => api.post('/draft/boards'),
  renameBoard: (id: string, name: string) => api.patch(`/draft/boards/${id}`, { name }),
  updateRankings: (id: string, rankings: unknown[]) => api.put(`/draft/boards/${id}/rankings`, rankings),
  simulateBoard: (id: string) => api.post(`/draft/boards/${id}/simulate`),
  deleteBoard: (id: string) => api.delete(`/draft/boards/${id}`),
}
