import {
  customersStore,
  vehiclesStore,
  appointmentsStore,
  serviceTypesStore,
  invoicesStore,
  staffStore,
} from "./mockData";

/**
 * FRONTEND-ONLY API LAYER
 *
 * Currently using mock/dummy data from mockData.js for development
 *
 * TO CONNECT TO YOUR BACKEND:
 * 1. Update each API object to make HTTP calls to your backend
 * 2. Example for customers:
 *    export const customersApi = {
 *      list: () => fetch('/api/customers').then(r => r.json()),
 *      get: (id) => fetch(`/api/customers/${id}`).then(r => r.json()),
 *      create: (data) => fetch('/api/customers', {
 *        method: 'POST',
 *        body: JSON.stringify(data)
 *      }).then(r => r.json()),
 *      ...
 *    }
 * 3. Update mockData.js stores with real API calls
 */

// Customers
export const customersApi = {
  list: () => customersStore.list(),
  get: (id) => customersStore.get(id),
  create: (data) => customersStore.create(data),
  update: (id, data) => customersStore.update(id, data),
  getAppointments: (id) => customersStore.getAppointments(id),
};

// Vehicles
export const vehiclesApi = {
  list: () => vehiclesStore.list(),
  get: (id) => vehiclesStore.get(id),
  getByCustomer: (customerId) => vehiclesStore.getByCustomer(customerId),
  create: (data) => vehiclesStore.create(data),
  update: (id, data) => vehiclesStore.update(id, data),
  delete: (id) => vehiclesStore.delete(id),
};

// Appointments
export const appointmentsApi = {
  list: () => appointmentsStore.list(),
  get: (id) => appointmentsStore.get(id),
  getCalendar: () => appointmentsStore.list(),
  getAvailableSlots: (date, serviceTypeId) =>
    appointmentsStore.getAvailableSlots(date, serviceTypeId),
  create: (data) => appointmentsStore.create(data),
  update: (id, data) => appointmentsStore.update(id, data),
  delete: (id) => appointmentsStore.delete(id),
  updateStatus: (id, data) => appointmentsStore.updateStatus(id, data),
  getStatusLog: () => Promise.resolve([]),
  getTracking: (status) => appointmentsStore.getTracking(status),
};

// Service Types
export const serviceTypesApi = {
  list: () => serviceTypesStore.list(),
  get: (id) => serviceTypesStore.get(id),
  create: (data) => serviceTypesStore.create(data),
  update: (id, data) => serviceTypesStore.update(id, data),
};

// Invoices
export const invoicesApi = {
  list: (status) => invoicesStore.list(status),
  get: (id) => invoicesStore.get(id),
  getByAppointment: (appointmentId) =>
    invoicesStore.getByAppointment(appointmentId),
  create: (data) => invoicesStore.create(data),
  update: (id, data) => invoicesStore.update(id, data),
  delete: (id) => invoicesStore.delete(id),
};

// Staff
export const staffApi = {
  list: () => staffStore.list(),
  get: (id) => staffStore.get(id),
  create: (data) => staffStore.create(data),
  update: (id, data) => staffStore.update(id, data),
  delete: (id) => staffStore.delete(id),
};
