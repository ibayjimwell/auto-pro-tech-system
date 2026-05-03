import apiClient from './client';

export const inventoryApi = {
  list: (search = '') => apiClient.get(`/inventory${search ? `?search=${search}` : ''}`),
  get: (id) => apiClient.get(`/inventory/${id}`),
  create: (data) => apiClient.post('/inventory', data),
  update: (id, data) => apiClient.put(`/inventory/${id}`, data),
  delete: (id) => apiClient.delete(`/inventory/${id}`),
  deductStock: (id, quantity) => apiClient.post(`/inventory/${id}/deduct`, { quantity }),
};