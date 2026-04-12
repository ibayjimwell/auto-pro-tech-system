// ─── Sample Data ────────────────────────────────────────────────────────────

export const MOCK_SERVICE_TYPES = [
  { id: 'st-1', name: 'Oil Change', description: 'Full synthetic oil change with filter replacement', basePrice: 850, estimatedMinutes: 45 },
  { id: 'st-2', name: 'Tire Rotation', description: 'Rotate and balance all four tires', basePrice: 500, estimatedMinutes: 30 },
  { id: 'st-3', name: 'Brake Inspection & Repair', description: 'Inspect and replace brake pads/rotors', basePrice: 2500, estimatedMinutes: 120 },
  { id: 'st-4', name: 'Air Conditioning Service', description: 'A/C recharge and leak inspection', basePrice: 1800, estimatedMinutes: 90 },
  { id: 'st-5', name: 'Engine Tune-Up', description: 'Spark plugs, filters, and system check', basePrice: 3200, estimatedMinutes: 180 },
  { id: 'st-6', name: 'Wheel Alignment', description: 'Four-wheel alignment and calibration', basePrice: 1200, estimatedMinutes: 60 },
  { id: 'st-7', name: 'Battery Replacement', description: 'Test and replace car battery', basePrice: 2200, estimatedMinutes: 30 },
  { id: 'st-8', name: 'Transmission Service', description: 'Fluid flush and filter replacement', basePrice: 4500, estimatedMinutes: 120 },
];

export const MOCK_STAFF = [
  { id: 'staff-1', fullName: 'Juan dela Cruz', email: 'juan@autocare.com', role: 'mechanic', phone: '09171234567', modules: ['service-tracking'], isActive: true },
  { id: 'staff-2', fullName: 'Maria Santos', email: 'maria@autocare.com', role: 'staff', phone: '09181234568', modules: ['customers', 'vehicles', 'appointments'], isActive: true },
  { id: 'staff-3', fullName: 'Roberto Reyes', email: 'roberto@autocare.com', role: 'mechanic', phone: '09191234569', modules: ['service-tracking'], isActive: true },
  { id: 'staff-4', fullName: 'Ana Gonzales', email: 'ana@autocare.com', role: 'cashier', phone: '09201234570', modules: ['invoices'], isActive: true },
  { id: 'staff-5', fullName: 'Carlo Mendoza', email: 'carlo@autocare.com', role: 'staff', phone: '09211234571', modules: ['customers', 'vehicles', 'appointments'], isActive: true },
];

export const MOCK_CUSTOMERS = [
  { id: 'cust-1', fullName: 'Pedro Bautista', email: 'pedro@email.com', phone: '09171112222', address: '123 Rizal St, Makati City' },
  { id: 'cust-2', fullName: 'Liza Fernandez', email: 'liza@email.com', phone: '09182223333', address: '456 Bonifacio Ave, Quezon City' },
  { id: 'cust-3', fullName: 'Ramon Aquino', email: 'ramon@email.com', phone: '09193334444', address: '789 Mabini Blvd, Pasig City' },
  { id: 'cust-4', fullName: 'Grace Villanueva', email: 'grace@email.com', phone: '09204445555', address: '321 Luna St, Mandaluyong' },
  { id: 'cust-5', fullName: 'Danilo Ramos', email: 'danilo@email.com', phone: '09215556666', address: '654 Burgos St, Taguig City' },
  { id: 'cust-6', fullName: 'Teresita Cruz', email: 'teresita@email.com', phone: '09226667777', address: '987 Del Pilar, Las Piñas' },
  { id: 'cust-7', fullName: 'Ernesto Tolentino', email: 'ernesto@email.com', phone: '09237778888', address: '147 Quezon Ave, Caloocan' },
  { id: 'cust-8', fullName: 'Maricel Pascual', email: 'maricel@email.com', phone: '09248889999', address: '258 Shaw Blvd, Mandaluyong' },
];

export const MOCK_VEHICLES = [
  { id: 'veh-1', customerId: 'cust-1', plateNumber: 'ABC-1234', make: 'Toyota', model: 'Fortuner', year: 2021, color: 'Silver' },
  { id: 'veh-2', customerId: 'cust-1', plateNumber: 'DEF-5678', make: 'Honda', model: 'Civic', year: 2019, color: 'Black' },
  { id: 'veh-3', customerId: 'cust-2', plateNumber: 'GHI-9012', make: 'Mitsubishi', model: 'Montero Sport', year: 2022, color: 'White' },
  { id: 'veh-4', customerId: 'cust-3', plateNumber: 'JKL-3456', make: 'Ford', model: 'Ranger', year: 2020, color: 'Blue' },
  { id: 'veh-5', customerId: 'cust-4', plateNumber: 'MNO-7890', make: 'Hyundai', model: 'Tucson', year: 2023, color: 'Gray' },
  { id: 'veh-6', customerId: 'cust-5', plateNumber: 'PQR-1357', make: 'Nissan', model: 'Navara', year: 2021, color: 'Red' },
  { id: 'veh-7', customerId: 'cust-6', plateNumber: 'STU-2468', make: 'Toyota', model: 'Vios', year: 2020, color: 'White' },
  { id: 'veh-8', customerId: 'cust-7', plateNumber: 'VWX-1122', make: 'Suzuki', model: 'Ertiga', year: 2022, color: 'Silver' },
  { id: 'veh-9', customerId: 'cust-8', plateNumber: 'YZA-3344', make: 'Kia', model: 'Sportage', year: 2023, color: 'Black' },
];

const today = new Date();
const d = (offsetDays) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().split('T')[0];
};

export const MOCK_APPOINTMENTS = [
  { id: 'appt-1', customerId: 'cust-1', customerName: 'Pedro Bautista', vehicleId: 'veh-1', vehiclePlate: 'ABC-1234', serviceTypeId: 'st-1', serviceName: 'Oil Change', assignedStaffId: 'staff-1', staffName: 'Juan dela Cruz', appointmentDate: d(-3), appointmentTime: '09:00', status: 'COMPLETED', notes: 'Used full synthetic 5W-30' },
  { id: 'appt-2', customerId: 'cust-2', customerName: 'Liza Fernandez', vehicleId: 'veh-3', vehiclePlate: 'GHI-9012', serviceTypeId: 'st-3', serviceName: 'Brake Inspection & Repair', assignedStaffId: 'staff-3', staffName: 'Roberto Reyes', appointmentDate: d(-2), appointmentTime: '10:30', status: 'COMPLETED', notes: 'Replaced front brake pads' },
  { id: 'appt-3', customerId: 'cust-3', customerName: 'Ramon Aquino', vehicleId: 'veh-4', vehiclePlate: 'JKL-3456', serviceTypeId: 'st-5', serviceName: 'Engine Tune-Up', assignedStaffId: 'staff-1', staffName: 'Juan dela Cruz', appointmentDate: d(-1), appointmentTime: '08:00', status: 'IN_PROGRESS', notes: 'Engine misfiring on startup' },
  { id: 'appt-4', customerId: 'cust-4', customerName: 'Grace Villanueva', vehicleId: 'veh-5', vehiclePlate: 'MNO-7890', serviceTypeId: 'st-4', serviceName: 'Air Conditioning Service', assignedStaffId: 'staff-3', staffName: 'Roberto Reyes', appointmentDate: d(0), appointmentTime: '09:30', status: 'CONFIRMED', notes: 'A/C not blowing cold' },
  { id: 'appt-5', customerId: 'cust-5', customerName: 'Danilo Ramos', vehicleId: 'veh-6', vehiclePlate: 'PQR-1357', serviceTypeId: 'st-2', serviceName: 'Tire Rotation', assignedStaffId: 'staff-2', staffName: 'Maria Santos', appointmentDate: d(0), appointmentTime: '11:00', status: 'PENDING', notes: '' },
  { id: 'appt-6', customerId: 'cust-6', customerName: 'Teresita Cruz', vehicleId: 'veh-7', vehiclePlate: 'STU-2468', serviceTypeId: 'st-6', serviceName: 'Wheel Alignment', assignedStaffId: 'staff-1', staffName: 'Juan dela Cruz', appointmentDate: d(1), appointmentTime: '14:00', status: 'CONFIRMED', notes: 'Vehicle pulling to the right' },
  { id: 'appt-7', customerId: 'cust-7', customerName: 'Ernesto Tolentino', vehicleId: 'veh-8', vehiclePlate: 'VWX-1122', serviceTypeId: 'st-7', serviceName: 'Battery Replacement', assignedStaffId: 'staff-3', staffName: 'Roberto Reyes', appointmentDate: d(1), appointmentTime: '10:00', status: 'PENDING', notes: 'Car not starting in the morning' },
  { id: 'appt-8', customerId: 'cust-8', customerName: 'Maricel Pascual', vehicleId: 'veh-9', vehiclePlate: 'YZA-3344', serviceTypeId: 'st-8', serviceName: 'Transmission Service', assignedStaffId: 'staff-1', staffName: 'Juan dela Cruz', appointmentDate: d(3), appointmentTime: '09:00', status: 'PENDING', notes: 'Slipping between gears' },
  { id: 'appt-9', customerId: 'cust-1', customerName: 'Pedro Bautista', vehicleId: 'veh-2', vehiclePlate: 'DEF-5678', serviceTypeId: 'st-3', serviceName: 'Brake Inspection & Repair', assignedStaffId: 'staff-3', staffName: 'Roberto Reyes', appointmentDate: d(5), appointmentTime: '13:00', status: 'PENDING', notes: '' },
];

export const MOCK_INVOICES = [
  { id: 'inv-1', appointmentId: 'appt-1', customerId: 'cust-1', customerName: 'Pedro Bautista', vehiclePlate: 'ABC-1234', serviceName: 'Oil Change', amount: 850, status: 'PAID', paymentMethod: 'CASH', paidAt: d(-3), notes: '' },
  { id: 'inv-2', appointmentId: 'appt-2', customerId: 'cust-2', customerName: 'Liza Fernandez', vehiclePlate: 'GHI-9012', serviceName: 'Brake Inspection & Repair', amount: 2500, status: 'PAID', paymentMethod: 'GCASH', paidAt: d(-2), notes: '' },
  { id: 'inv-3', appointmentId: 'appt-3', customerId: 'cust-3', customerName: 'Ramon Aquino', vehiclePlate: 'JKL-3456', serviceName: 'Engine Tune-Up', amount: 3200, status: 'PENDING', paymentMethod: null, paidAt: null, notes: 'Awaiting completion' },
  { id: 'inv-4', appointmentId: 'appt-4', customerId: 'cust-4', customerName: 'Grace Villanueva', vehiclePlate: 'MNO-7890', serviceName: 'Air Conditioning Service', amount: 1800, status: 'PENDING', paymentMethod: null, paidAt: null, notes: '' },
  { id: 'inv-5', appointmentId: 'appt-5', customerId: 'cust-5', customerName: 'Danilo Ramos', vehiclePlate: 'PQR-1357', serviceName: 'Tire Rotation', amount: 500, status: 'PENDING', paymentMethod: null, paidAt: null, notes: '' },
];

// ─── In-memory store (mutable) ──────────────────────────────────────────────

let customers = [...MOCK_CUSTOMERS];
let vehicles = [...MOCK_VEHICLES];
let appointments = [...MOCK_APPOINTMENTS];
let serviceTypes = [...MOCK_SERVICE_TYPES];
let invoices = [...MOCK_INVOICES];
let staff = [...MOCK_STAFF];

const uid = () => Math.random().toString(36).slice(2, 10);
const delay = (ms = 100) => new Promise(r => setTimeout(r, ms));

// ─── Customers ──────────────────────────────────────────────────────────────
export const customersStore = {
  list: async () => { await delay(); return [...customers]; },
  get: async (id) => { await delay(); return customers.find(c => c.id === id) || null; },
  create: async (data) => { await delay(); const rec = { id: 'cust-' + uid(), ...data }; customers.push(rec); return rec; },
  update: async (id, data) => { await delay(); customers = customers.map(c => c.id === id ? { ...c, ...data } : c); return customers.find(c => c.id === id); },
  getAppointments: async (id) => { await delay(); return appointments.filter(a => a.customerId === id); },
};

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const vehiclesStore = {
  list: async () => { await delay(); return [...vehicles]; },
  get: async (id) => { await delay(); return vehicles.find(v => v.id === id) || null; },
  getByCustomer: async (customerId) => { await delay(); return vehicles.filter(v => v.customerId === customerId); },
  create: async (data) => { await delay(); const rec = { id: 'veh-' + uid(), ...data }; vehicles.push(rec); return rec; },
  update: async (id, data) => { await delay(); vehicles = vehicles.map(v => v.id === id ? { ...v, ...data } : v); return vehicles.find(v => v.id === id); },
  delete: async (id) => { await delay(); vehicles = vehicles.filter(v => v.id !== id); return null; },
};

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointmentsStore = {
  list: async () => { await delay(); return [...appointments]; },
  get: async (id) => { await delay(); return appointments.find(a => a.id === id) || null; },
  create: async (data) => { await delay(); const rec = { id: 'appt-' + uid(), status: 'PENDING', ...data }; appointments.push(rec); return rec; },
  update: async (id, data) => { await delay(); appointments = appointments.map(a => a.id === id ? { ...a, ...data } : a); return appointments.find(a => a.id === id); },
  delete: async (id) => { await delay(); appointments = appointments.filter(a => a.id !== id); return null; },
  updateStatus: async (id, data) => { await delay(); appointments = appointments.map(a => a.id === id ? { ...a, status: data.status } : a); return appointments.find(a => a.id === id); },
  getTracking: async (status) => { await delay(); return status ? appointments.filter(a => a.status === status) : [...appointments]; },
  getAvailableSlots: async () => { await delay(); return ['08:00','09:00','09:30','10:00','10:30','11:00','13:00','14:00','15:00','16:00']; },
};

// ─── Service Types ───────────────────────────────────────────────────────────
export const serviceTypesStore = {
  list: async () => { await delay(); return [...serviceTypes]; },
  get: async (id) => { await delay(); return serviceTypes.find(s => s.id === id) || null; },
  create: async (data) => { await delay(); const rec = { id: 'st-' + uid(), ...data }; serviceTypes.push(rec); return rec; },
  update: async (id, data) => { await delay(); serviceTypes = serviceTypes.map(s => s.id === id ? { ...s, ...data } : s); return serviceTypes.find(s => s.id === id); },
};

// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoicesStore = {
  list: async (status) => { await delay(); return status ? invoices.filter(i => i.status === status) : [...invoices]; },
  get: async (id) => { await delay(); return invoices.find(i => i.id === id) || null; },
  getByAppointment: async (appointmentId) => { await delay(); return invoices.find(i => i.appointmentId === appointmentId) || null; },
  create: async (data) => { await delay(); const rec = { id: 'inv-' + uid(), status: 'PENDING', ...data }; invoices.push(rec); return rec; },
  update: async (id, data) => { await delay(); invoices = invoices.map(i => i.id === id ? { ...i, ...data } : i); return invoices.find(i => i.id === id); },
  delete: async (id) => { await delay(); invoices = invoices.filter(i => i.id !== id); return null; },
};

// ─── Staff ───────────────────────────────────────────────────────────────────
export const staffStore = {
  list: async () => { await delay(); return [...staff]; },
  get: async (id) => { await delay(); return staff.find(s => s.id === id) || null; },
  create: async (data) => { await delay(); const rec = { id: 'staff-' + uid(), ...data }; staff.push(rec); return rec; },
  update: async (id, data) => { await delay(); staff = staff.map(s => s.id === id ? { ...s, ...data } : s); return staff.find(s => s.id === id); },
  delete: async (id) => { await delay(); staff = staff.filter(s => s.id !== id); return null; },
};