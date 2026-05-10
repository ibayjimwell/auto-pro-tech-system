import apiClient from './client';

export const additionalCostsApi = {
  get: (appointmentId) => apiClient.get(`/additional-costs/appointments/${appointmentId}`),
  addLabor: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/labor`, data),
  addPart: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/part`, data),
  addDiscount: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/discount`, data),
  addFinding: (appointmentId, data) => apiClient.post(`/additional-costs/appointments/${appointmentId}/finding`, data),
  approve: (costId) => apiClient.patch(`/additional-costs/${costId}/approve`),
  decline: (costId) => apiClient.patch(`/additional-costs/${costId}/decline`),
  remove: (costId) => apiClient.delete(`/additional-costs/${costId}`),
};
