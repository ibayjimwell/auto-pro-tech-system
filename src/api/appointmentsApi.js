import apiClient from './client';

export const appointmentsApi = {
  // List with pagination & filters
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/appointments${query ? `?${query}` : ''}`);
  },
  get: (id) => apiClient.get(`/appointments/${id}`),
  create: (data) => apiClient.post('/appointments', data),
  update: (id, data) => apiClient.put(`/appointments/${id}`, data),
  cancel: (id, notes) => apiClient.delete(`/appointments/${id}`, { data: { notes } }),
  updateStatus: (id, status, notes) => apiClient.patch(`/appointments/${id}/status`, { status, notes }),
  getAvailableSlots: (date, serviceTypeId) =>
    apiClient.get(`/appointments/available-slots?date=${date}&serviceTypeId=${serviceTypeId}`),
  getCalendarView: (month) => apiClient.get(`/appointments/calendar?month=${month}`),
  checkAvailability: (date, startTime, serviceTypeId) =>
    apiClient.post('/appointments/check-availability', { date, startTime, serviceTypeId }),
};
