import React, { useState, useEffect } from 'react';
import DataModal from '@/components/shared/DataModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { customersApi, vehiclesApi, serviceTypesApi, staffApi, appointmentsApi } from '@/services/api';
import { notify } from '@/lib/notify';

export default function AppointmentForm({ open, onOpenChange, appointment, onSaved }) {
  const [form, setForm] = useState({
    customerId: '', vehicleId: '', serviceTypeId: '', appointmentDate: '', appointmentTime: '', notes: '', assignedStaffId: ''
  });
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      customersApi.list().catch(() => []),
      serviceTypesApi.list().catch(() => []),
      staffApi.list().catch(() => []),
    ]).then(([c, s, st]) => {
      setCustomers(Array.isArray(c) ? c : []);
      setServiceTypes(Array.isArray(s) ? s : []);
      setStaffList(Array.isArray(st) ? st : []);
    });

    if (appointment) {
      setForm({
        customerId: appointment.customerId || '',
        vehicleId: appointment.vehicleId || '',
        serviceTypeId: appointment.serviceTypeId || '',
        appointmentDate: appointment.appointmentDate || '',
        appointmentTime: appointment.appointmentTime || '',
        notes: appointment.notes || '',
        assignedStaffId: appointment.assignedStaffId || '',
      });
    } else {
      setForm({ customerId: '', vehicleId: '', serviceTypeId: '', appointmentDate: '', appointmentTime: '', notes: '', assignedStaffId: '' });
    }
  }, [open, appointment]);

  useEffect(() => {
    if (form.customerId) {
      vehiclesApi.getByCustomer(form.customerId).then(v => setVehicles(Array.isArray(v) ? v : [])).catch(() => setVehicles([]));
    }
  }, [form.customerId]);

  useEffect(() => {
    if (form.appointmentDate && form.serviceTypeId) {
      appointmentsApi.getAvailableSlots(form.appointmentDate, form.serviceTypeId)
        .then(slots => setAvailableSlots(Array.isArray(slots) ? slots : []))
        .catch(() => setAvailableSlots([]));
    }
  }, [form.appointmentDate, form.serviceTypeId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (appointment) {
        await appointmentsApi.update(appointment.id, form);
        notify.success('Appointment updated');
      } else {
        await appointmentsApi.create(form);
        notify.success('Appointment created');
      }
      onSaved();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
    setSaving(false);
  };

  return (
    <DataModal open={open} onOpenChange={onOpenChange} title={appointment ? 'Edit Appointment' : 'New Appointment'} onSubmit={handleSave} isLoading={saving}>
      <div className="space-y-2">
        <Label>Customer</Label>
        <Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v, vehicleId: '' })}>
          <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
          <SelectContent>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Vehicle</Label>
        <Select value={form.vehicleId} onValueChange={v => setForm({ ...form, vehicleId: v })}>
          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
          <SelectContent>
            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Service Type</Label>
        <Select value={form.serviceTypeId} onValueChange={v => setForm({ ...form, serviceTypeId: v })}>
          <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
          <SelectContent>
            {serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - ₱{s.basePrice}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Time</Label>
          {availableSlots.length > 0 ? (
            <Select value={form.appointmentTime} onValueChange={v => setForm({ ...form, appointmentTime: v })}>
              <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
              <SelectContent>
                {availableSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input type="time" value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })} />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Assigned Staff</Label>
        <Select value={form.assignedStaffId} onValueChange={v => setForm({ ...form, assignedStaffId: v })}>
          <SelectTrigger><SelectValue placeholder="Assign staff (optional)" /></SelectTrigger>
          <SelectContent>
            {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} - {s.role}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
      </div>
    </DataModal>
  );
}