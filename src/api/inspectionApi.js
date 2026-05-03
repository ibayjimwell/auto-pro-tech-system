import apiClient from './client';

export const inspectionApi = {
  // Tasks
  getTasks: (appointmentId) => apiClient.get(`/inspection/appointments/${appointmentId}/tasks`),
  createTask: (appointmentId, data) => apiClient.post(`/inspection/appointments/${appointmentId}/tasks`, data),
  updateTask: (taskId, data) => apiClient.put(`/inspection/tasks/${taskId}`, data),
  deleteTask: (taskId) => apiClient.delete(`/inspection/tasks/${taskId}`),

  // Findings
  addFinding: (taskId, data) => apiClient.post(`/inspection/tasks/${taskId}/findings`, data),
  deleteFinding: (findingId) => apiClient.delete(`/inspection/findings/${findingId}`),

  // Products
  addProduct: (taskId, product) => apiClient.post(`/inspection/tasks/${taskId}/products`, product),
  deleteProduct: (productId) => apiClient.delete(`/inspection/products/${productId}`),

  // Complete inspection
  completeInspection: (appointmentId) => apiClient.post(`/inspection/appointments/${appointmentId}/complete-inspection`),
};