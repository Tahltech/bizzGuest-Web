import { apiClient } from './client.js';

export const paymentsApi = {
  listForBooking: (idOrReference) => apiClient.get(`/payments/bookings/${idOrReference}`).then((r) => r.data.data),
  listMine: (params) => apiClient.get('/payments/me', { params }).then((r) => r.data),
  listAll: (params) => apiClient.get('/payments', { params }).then((r) => r.data),
  initiateMobileMoney: (idOrReference, payload) =>
    apiClient.post(`/payments/bookings/${idOrReference}/mobile-money`, payload).then((r) => r.data.data),
  recordManual: (idOrReference, payload) =>
    apiClient.post(`/payments/bookings/${idOrReference}/manual`, payload).then((r) => r.data.data),
  refresh: (paymentId) => apiClient.post(`/payments/${paymentId}/refresh`).then((r) => r.data.data),
  refund: (paymentId, reason) => apiClient.post(`/payments/${paymentId}/refund`, { reason }).then((r) => r.data.data)
};
