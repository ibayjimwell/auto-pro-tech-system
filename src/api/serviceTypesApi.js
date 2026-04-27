import apiClient from './client';

export const serviceTypesApi = {
  listActive: () => apiClient.get('/service-types?active=true'),
};