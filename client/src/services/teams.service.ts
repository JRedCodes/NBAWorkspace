// Phase 2
import api from '../lib/api'

export const teamsService = {
  getAll: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  getRoster: (id: string) => api.get(`/teams/${id}/roster`),
  getCap: (id: string) => api.get(`/teams/${id}/cap`),
  getPicks: (id: string) => api.get(`/teams/${id}/picks`),
  getStats: (id: string) => api.get(`/teams/${id}/stats`),
  getNeeds: (id: string) => api.get(`/teams/${id}/needs`),
  getAnalytics: (id: string) => api.get(`/teams/${id}/analytics`),
  getProjectedNeeds: (teamId: string, outgoingPlayerIds: string[], incomingPlayerIds: string[]) =>
    api.post(`/teams/${teamId}/needs/projected`, { outgoingPlayerIds, incomingPlayerIds }),
  getCarousel: () => api.get('/teams/league/carousel'),
}
