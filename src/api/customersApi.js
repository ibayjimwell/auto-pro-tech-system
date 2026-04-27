import apiClient from './client';

export const customersApi = {
  list: (search = '') => apiClient.get(`/customers${search ? `?search=${search}` : ''}`),
  get: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
  getAppointments: (id) => apiClient.get(`/customers/${id}/appointments`),
};