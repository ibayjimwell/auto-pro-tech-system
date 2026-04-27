import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, ClockIcon, UserIcon, CarIcon, WrenchIcon, UserCircleIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notify';
import { customersApi } from '@/api/customersApi';
import { vehiclesApi } from '@/api/vehiclesApi';
import { serviceTypesApi } from '@/api/serviceTypesApi';
import { staffApi } from '@/api/staffApi';
import { appointmentsApi } from '@/api/appointmentsApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const schema = z.object({
  customerId: z.string().uuid('Select a customer'),
  vehicleId: z.string().uuid('Select a vehicle'),
  serviceTypeId: z.string().uuid('Select a service'),
  appointmentDate: z.date({ required_error: 'Select date' }),
  appointmentTime: z.string().min(1, 'Select time'),
  notes: z.string().optional(),
  assignedStaffId: z.string().uuid().optional().nullable(),
});

export default function AppointmentForm({ open, onOpenChange, appointment, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      vehicleId: '',
      serviceTypeId: '',
      appointmentDate: null,
      appointmentTime: '',
      notes: '',
      assignedStaffId: null,
    },
  });

  const selectedServiceId = watch('serviceTypeId');
  const selectedDate = watch('appointmentDate');
  const selectedCustomerId = watch('customerId');

  // Load dependencies
  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, stRes, staffRes] = await Promise.all([
          customersApi.list(),
          serviceTypesApi.listActive(),
          staffApi.listActive(),
        ]);
        setCustomers(custRes.data.data || []);
        setServiceTypes(stRes.data.data || []);
        setStaffList(staffRes.data.data || []);
      } catch (err) { console.error(err); }
    };
    if (open) load();
  }, [open]);

  // Load vehicles when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      vehiclesApi.listByCustomer(selectedCustomerId)
        .then(res => setVehicles(res.data.data || []))
        .catch(err => setVehicles([]));
    } else {
      setVehicles([]);
    }
  }, [selectedCustomerId]);

  // Load available slots when date or service changes
  useEffect(() => {
    if (selectedDate && selectedServiceId) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      appointmentsApi.getAvailableSlots(dateStr, selectedServiceId)
        .then(res => setAvailableSlots(res.data.data || []))
        .catch(err => setAvailableSlots([]));
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedServiceId]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        serviceTypeId: data.serviceTypeId,
        appointmentDate: format(data.appointmentDate, 'yyyy-MM-dd'),
        appointmentTime: data.appointmentTime,
        notes: data.notes || null,
        assignedStaffId: data.assignedStaffId || null,
      };
      if (appointment) {
        await appointmentsApi.update(appointment.id, payload);
        notify.success('Appointment updated');
      } else {
        await appointmentsApi.create(payload);
        notify.success('Appointment created');
      }
      onSaved?.();
      onOpenChange(false);
      reset();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving appointment');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (appointment && open) {
      setValue('customerId', appointment.customerId);
      setValue('vehicleId', appointment.vehicleId);
      setValue('serviceTypeId', appointment.serviceTypeId);
      setValue('appointmentDate', parseISO(appointment.appointmentDate));
      setValue('appointmentTime', appointment.appointmentTime.slice(0, 5));
      setValue('notes', appointment.notes || '');
      setValue('assignedStaffId', appointment.assignedStaffId || null);
    } else if (!appointment && open) {
      reset();
    }
  }, [appointment, open, setValue, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Customer</Label>
            <Select onValueChange={(val) => setValue('customerId', val)} value={watch('customerId')}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.fullName} ({c.email})</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
          </div>

          <div>
            <Label>Vehicle</Label>
            <Select onValueChange={(val) => setValue('vehicleId', val)} value={watch('vehicleId')} disabled={!selectedCustomerId}>
              <SelectTrigger><SelectValue placeholder={selectedCustomerId ? "Select vehicle" : "Select customer first"} /></SelectTrigger>
              <SelectContent>
                {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId.message}</p>}
          </div>

          <div>
            <Label>Service Type</Label>
            <Select onValueChange={(val) => setValue('serviceTypeId', val)} value={watch('serviceTypeId')}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (₱{s.basePrice})</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.serviceTypeId && <p className="text-red-500 text-sm mt-1">{errors.serviceTypeId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <DatePicker
                selected={watch('appointmentDate')}
                onChange={(date) => setValue('appointmentDate', date)}
                minDate={new Date()}
                className="w-full p-2 border rounded-md"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
              />
              {errors.appointmentDate && <p className="text-red-500 text-sm mt-1">{errors.appointmentDate.message}</p>}
            </div>
            <div>
              <Label>Time</Label>
              <Select onValueChange={(val) => setValue('appointmentTime', val)} value={watch('appointmentTime')} disabled={!availableSlots.length}>
                <SelectTrigger><SelectValue placeholder={availableSlots.length ? "Select time" : "Pick date & service first"} /></SelectTrigger>
                <SelectContent>
                  {availableSlots.filter(slot => slot.available).map(slot => (
                    <SelectItem key={slot.time} value={slot.time.slice(0,5)}>{slot.time.slice(0,5)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.appointmentTime && <p className="text-red-500 text-sm mt-1">{errors.appointmentTime.message}</p>}
            </div>
          </div>

          <div>
            <Label>Assigned Staff (optional)</Label>
            <Select onValueChange={(val) => setValue('assignedStaffId', val)} value={watch('assignedStaffId') || ''}>
              <SelectTrigger><SelectValue placeholder="Assign staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.role})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Additional details..." rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}