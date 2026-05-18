import apiClient from './client';

export const serviceTypesApi = {
  list: (active) => {
    const params = active !== undefined ? `?active=${active}` : '';
    return apiClient.get(`/service-types${params}`);
  },
  listActive: () => apiClient.get('/service-types?active=true'),
  get: (id) => apiClient.get(`/service-types/${id}`),
  create: (data) => apiClient.post('/service-types', data),
  update: (id, data) => apiClient.put(`/service-types/${id}`, data),
  deactivate: (id) => apiClient.delete(`/service-types/${id}`),   // soft delete
  enable: (id) => apiClient.put(`/service-types/${id}`, { active: true }),  // reactivate
  permanentDelete: (id) => apiClient.delete(`/service-types/${id}/permanent`),
};
