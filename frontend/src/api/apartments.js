import { apiClient } from './client.js';

export const apartmentsApi = {
  list: (params) => apiClient.get('/apartments', { params }).then((r) => r.data),
  detail: (idOrSlug) => apiClient.get(`/apartments/${idOrSlug}`).then((r) => r.data.data),
  create: (payload) => apiClient.post('/apartments', payload).then((r) => r.data.data),
  update: (id, payload) => apiClient.put(`/apartments/${id}`, payload).then((r) => r.data.data),
  remove: (id) => apiClient.delete(`/apartments/${id}`).then((r) => r.data),
  uploadMedia: (id, files) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return apiClient.post(`/apartments/${id}/media`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
  },
  deleteMedia: (id, mediaId) => apiClient.delete(`/apartments/${id}/media/${mediaId}`).then((r) => r.data),
  updateMedia: (id, mediaId, payload) => apiClient.patch(`/apartments/${id}/media/${mediaId}`, payload).then((r) => r.data.data)
};

export const apartmentTypesApi = {
  list: () => apiClient.get('/apartment-types').then((r) => r.data.data),
  create: (payload) => apiClient.post('/apartment-types', payload).then((r) => r.data.data)
};

export const amenitiesApi = {
  list: () => apiClient.get('/amenities').then((r) => r.data.data)
};
