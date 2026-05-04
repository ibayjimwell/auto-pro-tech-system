import apiClient from './client';

export const serviceTypesApi = {
  list: (active = true) => apiClient.get(`/service-types?active=${active}`),
  get: (id) => apiClient.get(`/service-types/${id}`),
  create: (data) => apiClient.post('/service-types', data),
  update: (id, data) => apiClient.put(`/service-types/${id}`, data),
  deactivate: (id) => apiClient.delete(`/service-types/${id}`),   // soft delete
  permanentDelete: (id) => apiClient.delete(`/service-types/${id}/permanent`),
};