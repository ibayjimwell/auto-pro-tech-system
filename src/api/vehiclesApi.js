import apiClient from './client';

export const vehiclesApi = {
  listByCustomer: (customerId) => apiClient.get(`/vehicles/customer/${customerId}`),
};