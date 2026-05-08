import apiClient from './client';

export const estimateApi = {
  get: (appointmentId) => apiClient.get(`/estimate/appointments/${appointmentId}/estimate`),
  addLabor: (appointmentId, data) => apiClient.post(`/estimate/appointments/${appointmentId}/estimate/labor`, data),
  removeLabor: (adjustmentId) => apiClient.delete(`/estimate/labor/${adjustmentId}`),
  addDiscount: (appointmentId, data) => apiClient.post(`/estimate/appointments/${appointmentId}/estimate/discount`, data),
  removeDiscount: (adjustmentId) => apiClient.delete(`/estimate/discount/${adjustmentId}`),
};