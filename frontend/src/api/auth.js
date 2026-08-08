import { apiClient } from './client.js';

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data.data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data.data),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload).then((r) => r.data.data)
};
