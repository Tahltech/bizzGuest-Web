import { apiClient } from './client.js';

export const availabilityApi = {
  search: ({ checkIn, checkOut, guests }) =>
    apiClient.get('/availability/search', { params: { checkIn, checkOut, guests } }).then((r) => r.data.data)
};
