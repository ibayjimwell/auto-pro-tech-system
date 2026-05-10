import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addMonths, format, isSameDay, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// --- Shared Components & Icons ---
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CalendarDays, Loader2, Car, User, Phone, Clock, CheckCircle, 
  XCircle, Filter, Search, PlusCircle, Wrench, UserCircle 
} from 'lucide-react';

// --- API & State ---
import { appointmentsApi } from '@/api/appointmentsApi';
import { customersApi } from '@/api/customersApi';
import { vehiclesApi } from '@/api/vehiclesApi';
import { serviceTypesApi } from '@/api/serviceTypesApi';
import { staffApi } from '@/api/staffApi';
import { notify } from '@/lib/notify';
import { useAppointmentsSocket } from '@/hooks/useAppointmentsSocket';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from "@/lib/utils";

// Form Validation Schema
const schema = z.object({
  customerId: z.string().uuid('Select a customer'),
  vehicleId: z.string().uuid('Select a vehicle'),
  serviceTypeId: z.string().uuid('Select a service'),
  appointmentDate: z.date({ required_error: 'Select date' }),
  appointmentTime: z.string().min(1, 'Select time'),
  notes: z.string().optional(),
  assignedStaffId: z.string().uuid().optional().nullable(),
});

// Helper: 24h to 12h time
const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hour, minute] = time24.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

export default function Appointments() {
  // --- Core State ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [declineModal, setDeclineModal] = useState({ open: false, appointment: null, reason: '' });
  const [sidebarFilter, setSidebarFilter] = useState('');

  // --- Form Dependencies State ---
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- React Hook Form Setup ---
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '', vehicleId: '', serviceTypeId: '',
      appointmentDate: new Date(), appointmentTime: '',
      notes: '', assignedStaffId: null,
    },
  });

  const watchCustomerId = watch('customerId');
  const watchServiceId = watch('serviceTypeId');
  const watchDate = watch('appointmentDate');

  // --- Load Data Functions ---
  const loadAppointments = async () => {
    try {
      const res = await appointmentsApi.list();
      setAppointments(res.data?.data || []);
    } catch { setAppointments([]); }
  };

  const loadDependencies = async () => {
    try {
      const [custRes, stRes, staffRes] = await Promise.all([
        customersApi.list(),
        serviceTypesApi.listActive(),
        staffApi.listActive(),
      ]);
      setCustomers(custRes.data.data || []);
      setServiceTypes(stRes.data.data || []);
      setStaffList(staffRes.data.data || []);
    } catch (err) { notify.error("Failed to load form options"); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadAppointments(), loadDependencies()]);
      setLoading(false);
    };
    init();
  }, []);

  // --- Dynamic Form Logic ---
  useEffect(() => {
    if (watchCustomerId) {
      vehiclesApi.listByCustomer(watchCustomerId)
        .then(res => setVehicles(res.data.data || []))
        .catch(() => setVehicles([]));
    }
  }, [watchCustomerId]);

  useEffect(() => {
    if (watchDate && watchServiceId) {
      const dateStr = format(watchDate, 'yyyy-MM-dd');
      appointmentsApi.getAvailableSlots(dateStr, watchServiceId)
        .then(res => setAvailableSlots(res.data.data || []))
        .catch(() => setAvailableSlots([]));
    }
  }, [watchDate, watchServiceId]);

  // Sync Calendar selection with Form
  useEffect(() => {
    if (selectedDate) setValue('appointmentDate', selectedDate);
  }, [selectedDate, setValue]);

  // --- Event Handlers ---
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        appointmentDate: format(data.appointmentDate, 'yyyy-MM-dd'),
      };
      await appointmentsApi.create(payload);
      notify.success('Appointment booked successfully');
      reset({ ...data, appointmentTime: '', notes: '' });
      await loadAppointments();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Booking failed');
    } finally { setIsSubmitting(false); }
  };

  const handleConfirm = async (appt) => {
    try {
      await appointmentsApi.updateStatus(appt.id, 'CONFIRMED', 'Confirmed by staff');
      notify.success(`Appointment confirmed`);
      await loadAppointments();
    } catch (err) { notify.error('Confirmation failed'); }
  };

  const handleDecline = async () => {
    const { appointment, reason } = declineModal;
    if (!reason.trim()) return notify.error('Reason is required');
    try {
      await appointmentsApi.updateStatus(appointment.id, 'CANCELLED', reason);
      notify.success('Appointment declined');
      setDeclineModal({ open: false, appointment: null, reason: '' });
      await loadAppointments();
    } catch { notify.error('Update failed'); }
  };

  // --- Real-time Updates ---
  useAppointmentsSocket(({ type, appointment }) => {
    if (['created', 'updated', 'statusChanged', 'cancelled'].includes(type)) {
      loadAppointments();
    }
  });

  // --- Filtering Logic ---
  const filteredAppointments = appointments
    .filter(a => {
      const matchesDate = a.appointmentDate && isSameDay(new Date(a.appointmentDate), selectedDate);
      const searchStr = `${a.customer?.fullName} ${a.vehicle?.plateNumber} ${a.vehicle?.model}`.toLowerCase();
      const matchesSearch = searchStr.includes(sidebarFilter.toLowerCase());
      return matchesDate && matchesSearch;
    })
    .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer title="Service Scheduler" subtitle="Manage shop flow and customer bookings">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* --- LEFT & CENTER: Calendar and Booking Form --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Calendar Section */}
          <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
            <AppointmentCalendar
              currentMonth={currentMonth}
              onMonthChange={(dir) => setCurrentMonth(addMonths(currentMonth, dir))}
              appointments={appointments}
              selectedDate={selectedDate}
              onDateClick={setSelectedDate}
            />
          </Card>

          {/* Quick Booking Form Section */}
          <Card className="border-none shadow-lg bg-slate-50/50 rounded-3xl border border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" /> 
                New Booking for {format(selectedDate, 'MMM dd')}
              </CardTitle>
              <CardDescription className="font-bold text-xs">Fill in the details to reserve a service slot.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Field */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500">Customer</Label>
                    <Select onValueChange={(val) => setValue('customerId', val)} value={watch('customerId')}>
                      <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                        <SelectValue placeholder="Identify customer..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.fullName} <span className="text-[10px] opacity-50 ml-2">({c.phone})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehicle Field */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500">Vehicle</Label>
                    <Select 
                      onValueChange={(val) => setValue('vehicleId', val)} 
                      value={watch('vehicleId')} 
                      disabled={!watchCustomerId}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                        <SelectValue placeholder={watchCustomerId ? "Select asset..." : "Select customer first"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id} className="text-xs">
                            {v.make} {v.model} [{v.plateNumber}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Type */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500">Service Category</Label>
                    <Select onValueChange={(val) => setValue('serviceTypeId', val)} value={watch('serviceTypeId')}>
                      <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                        <SelectValue placeholder="Work to be done..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {serviceTypes.map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500">Available Slot</Label>
                    <Select 
                      onValueChange={(val) => setValue('appointmentTime', val)} 
                      value={watch('appointmentTime')} 
                      disabled={!availableSlots.length}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                        <SelectValue placeholder={availableSlots.length ? "Pick time..." : "Select service first"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {availableSlots.filter(s => s.available).map(slot => (
                          <SelectItem key={slot.time} value={slot.time.slice(0,5)}>{slot.time.slice(0,5)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Staff Assignment & Notes</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select onValueChange={(val) => setValue('assignedStaffId', val)} value={watch('assignedStaffId') || ''}>
                      <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 col-span-1">
                        <SelectValue placeholder="Assign staff..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Auto-Assign Later</SelectItem>
                        {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Textarea 
                      {...register('notes')} 
                      placeholder="Symptoms or specific requests..." 
                      className="rounded-xl bg-white border-slate-200 md:col-span-2 min-h-[48px]"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-14 rounded-2xl text-base font-black uppercase shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 w-5 h-5" />}
                  Confirm Appointment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT: Daily Agenda & Filtering --- */}
        <div className="lg:col-span-4 h-full">
          <Card className="flex flex-col h-[calc(100vh-12rem)] shadow-xl border-none rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white pb-6">
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Daily Agenda
                </CardTitle>
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {filteredAppointments.length} Booked
                </div>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Filter by plate or name..." 
                  className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-slate-400 h-10 rounded-xl"
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto pt-6 space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="text-slate-300 w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Clear Schedule</p>
                </div>
              ) : (
                filteredAppointments.map((appt) => (
                  <div key={appt.id} className="group p-4 rounded-2xl border border-slate-100 hover:border-primary/30 bg-white hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-black text-slate-700">
                          {formatTime12h(appt.appointmentTime)}
                        </span>
                      </div>
                      <StatusBadge status={appt.status || 'PENDING'} className="text-[9px] font-black" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg h-fit"><Car className="w-4 h-4 text-primary" /></div>
                        <div>
                          <p className="text-xs font-black uppercase text-slate-900">{appt.vehicle?.make} {appt.vehicle?.model}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Plate: {appt.vehicle?.plateNumber}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg h-fit"><UserCircle className="w-4 h-4 text-slate-500" /></div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 leading-none mt-1">{appt.customer?.fullName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{appt.customer?.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions for Pending */}
                    {appt.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-green-600 hover:bg-green-50 h-8 text-[10px] font-black uppercase"
                          onClick={() => handleConfirm(appt)}
                        >
                          Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-400 hover:bg-red-50 h-8 text-[10px] font-black uppercase"
                          onClick={() => setDeclineModal({ open: true, appointment: appt, reason: '' })}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decline Reason Dialog */}
      <Dialog open={declineModal.open} onOpenChange={(open) => setDeclineModal({ ...declineModal, open })}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Decline Appointment</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-500">
              Provide a brief explanation for the customer regarding the cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Shop at capacity, parts backordered..."
              className="h-12 rounded-xl bg-slate-50"
              value={declineModal.reason}
              onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeclineModal({ open: false, appointment: null, reason: '' })} className="font-bold uppercase text-xs">Ignore</Button>
            <Button variant="destructive" onClick={handleDecline} className="font-black uppercase text-xs px-6 rounded-xl">Confirm Decline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}