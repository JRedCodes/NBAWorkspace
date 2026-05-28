import api from '../lib/api'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    displayName: string
    onboardingCompleted: boolean
  }
}

export const authService = {
  register(email: string, password: string, displayName: string): Promise<{ data: AuthResponse }> {
    return api.post('/auth/register', { email, password, displayName })
  },

  login(email: string, password: string): Promise<{ data: AuthResponse }> {
    return api.post('/auth/login', { email, password })
  },

  refresh(refreshToken: string): Promise<{ data: { accessToken: string } }> {
    return api.post('/auth/refresh', { refreshToken })
  },

  logout(): Promise<void> {
    return api.post('/auth/logout')
  },

  setOnboarding(completed: boolean): Promise<void> {
    return api.patch('/auth/onboarding', { completed })
  },
}
