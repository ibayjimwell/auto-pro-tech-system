import apiClient from './client';

export const additionalCostsApi = {
  get: (appointmentId) => apiClient.get(`/additional-costs/appointments/${appointmentId}`),
  addLabor: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/labor`, data),
  addPart: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/part`, data),
  addDiscount: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/discount`, data),
  remove: (costId) => apiClient.delete(`/additional-costs/${costId}`),
};