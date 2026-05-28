// Phase 2
import api from '../lib/api'

export const playersService = {
  search: (q: string) => api.get('/players/search', { params: { q } }),
  getById: (id: string) => api.get(`/players/${id}`),
  getStats: (id: string, season?: string) => api.get(`/players/${id}/stats`, { params: { season } }),
  getMetrics: (id: string) => api.get(`/players/${id}/metrics`),
  getFitForTeam: (playerId: string, teamId: string) => api.get(`/players/${playerId}/fit/${teamId}`),
  getFitAll: (id: string) => api.get(`/players/${id}/fit/all`),
  getContract: (id: string) => api.get(`/players/${id}/contract`),
  getShotChart: (id: string, params?: Record<string, string>) => api.get(`/players/${id}/shotchart`, { params }),
  getShotZones: (id: string, params?: Record<string, string>) => api.get(`/players/${id}/shotchart/zones`, { params }),
}
