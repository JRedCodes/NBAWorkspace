import api from '../lib/api'

export const workspaceService = {
  get: () => api.get('/workspace'),
  reset: () => api.post('/workspace/reset'),
}
