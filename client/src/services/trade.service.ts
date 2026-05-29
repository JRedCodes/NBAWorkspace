// Phase 3
import api from '../lib/api'

export const tradeService = {
  validate: (payload: unknown) => api.post('/trade/validate', payload),
  project: (payload: unknown) => api.post('/trade/project', payload),
  getScenarios: () => api.get('/trade/scenarios'),
  getScenario: (id: string) => api.get(`/trade/scenarios/${id}`),
  createScenario: (payload: unknown) => api.post('/trade/scenarios', payload),
  updateScenario: (id: string, payload: unknown) => api.patch(`/trade/scenarios/${id}`, payload),
  duplicateScenario: (id: string) => api.post(`/trade/scenarios/${id}/duplicate`),
  getScenarioLegs: (id: string) => api.get(`/trade/scenarios/${id}/legs`),
  deleteScenario: (id: string) => api.delete(`/trade/scenarios/${id}`),
}
