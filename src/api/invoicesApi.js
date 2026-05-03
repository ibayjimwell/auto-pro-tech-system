import apiClient from './client';

export const invoicesApi = {
  create: (data) => apiClient.post('/invoices', data),
  get: (id) => apiClient.get(`/invoices/${id}`),
  getByAppointment: (appointmentId) => apiClient.get(`/invoices/appointment/${appointmentId}`),
  update: (id, data) => apiClient.put(`/invoices/${id}`, data),
  delete: (id) => apiClient.delete(`/invoices/${id}`),
};