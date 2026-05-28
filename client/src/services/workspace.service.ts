// Phase 2
import api from '../lib/api'

export const workspaceService = {
  get: () => api.get('/workspace'),
  getActivity: () => api.get('/workspace/activity'),
}
