// Phase 6
import api from '../lib/api'

export const simulationService = {
  create: (payload: unknown) => api.post('/simulation', payload),
  getAll: () => api.get('/simulation'),
  getResults: (id: string) => api.get(`/simulation/${id}/results`),
  delete: (id: string) => api.delete(`/simulation/${id}`),
}
