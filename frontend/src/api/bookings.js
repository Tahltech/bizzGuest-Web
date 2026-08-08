import { apiClient } from './client.js';

export const bookingsApi = {
  create: (payload) => apiClient.post('/bookings', payload).then((r) => r.data.data),
  list: (params) => apiClient.get('/bookings', { params }).then((r) => r.data),
  detail: (idOrReference) => apiClient.get(`/bookings/${idOrReference}`).then((r) => r.data.data),
  cancel: (idOrReference, reason) => apiClient.post(`/bookings/${idOrReference}/cancel`, { reason }).then((r) => r.data.data)
};
