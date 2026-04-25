import apiClient from './client';

export const staffApi = {
  list: (query = '') => apiClient.get(`/staff${query ? `?${query}` : ''}`),
  get: (id) => apiClient.get(`/staff/${id}`),
  create: (data) => apiClient.post('/staff', data),
  update: (id, data) => apiClient.put(`/staff/${id}`, data),
  delete: (id) => apiClient.delete(`/staff/${id}`),
  resetPassword: (id) => apiClient.post(`/staff/${id}/reset-password`),
};