import React, { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CalendarDays, Loader2, Car, User, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { appointmentsApi } from '@/api/appointmentsApi';
import { notify } from '@/lib/notify';
import { format, isSameDay } from 'date-fns';
import { useAppointmentsSocket } from '@/hooks/useAppointmentsSocket';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Helper: convert "HH:MM:SS" to "h:mm A" (e.g., "14:30:00" → "2:30 PM")
const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hour, minute] = time24.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [declineModal, setDeclineModal] = useState({ open: false, appointment: null, reason: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list();
      setAppointments(res.data?.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useAppointmentsSocket(({ type, appointment }) => {
    if (type === 'created') {
      load();
    } else if (type === 'statusChanged' || type === 'updated') {
      setAppointments(prev => prev.map(a => a.id === appointment.id ? appointment : a));
    } else if (type === 'cancelled') {
      setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: 'CANCELLED' } : a));
    }
  });

  const dayAppointments = selectedDate
    ? appointments
        .filter(a => a.appointmentDate && isSameDay(new Date(a.appointmentDate), selectedDate))
        .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''))
    : [];

  useEffect(() => {
    if (selectedDate) {
      setRefreshing(true);
      const timer = setTimeout(() => setRefreshing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [appointments, selectedDate]);

  const handleConfirm = async (appt) => {
    try {
      await appointmentsApi.updateStatus(appt.id, 'CONFIRMED', 'Confirmed by staff');
      notify.success(`Appointment confirmed`);
      await load();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDecline = async () => {
    const { appointment, reason } = declineModal;
    if (!reason.trim()) {
      notify.error('Please provide a reason for declining');
      return;
    }
    try {
      await appointmentsApi.updateStatus(appointment.id, 'CANCELLED', reason);
      notify.success('Appointment declined');
      setDeclineModal({ open: false, appointment: null, reason: '' });
      await load();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer
      title="Appointments"
      subtitle="Schedule and manage appointments"
      actions={
        <Button onClick={() => { setEditingAppt(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />New Appointment
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <AppointmentCalendar
            currentMonth={currentMonth}
            onMonthChange={(dir) => setCurrentMonth(addMonths(currentMonth, dir))}
            appointments={appointments}
            selectedDate={selectedDate}
            onDateClick={setSelectedDate}
          />
        </div>

        {/* Day Details – Scrollable Card with theme consistency */}
        <Card className="flex flex-col h-[calc(100vh-12rem)] shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="font-heading text-base flex items-center gap-2 text-primary">
              <CalendarDays className="w-4 h-4" />
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Click on a date to see appointments
              </p>
            ) : refreshing ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : dayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No appointments for this date
              </p>
            ) : (
              <div className="space-y-4">
                {dayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
                  >
                    {/* Header: Time + Status */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {formatTime12h(appt.appointmentTime)}
                        </span>
                      </div>
                      <StatusBadge status={appt.status || 'PENDING'} />
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-start gap-2 mb-2">
                      <Car className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {appt.vehicle?.make} {appt.vehicle?.model}
                          {appt.vehicle?.year ? ` (${appt.vehicle.year})` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Plate: {appt.vehicle?.plateNumber || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-start gap-2 mb-2">
                      <User className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{appt.customer?.fullName || '—'}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{appt.customer?.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appt.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 border-primary/30">
                        {appt.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-2 border-t border-border">
                      {appt.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleConfirm(appt)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeclineModal({ open: true, appointment: appt, reason: '' })}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirmed – awaiting inspection</span>
                        </div>
                      )}
                      {appt.status === 'CANCELLED' && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                          <XCircle className="w-4 h-4" />
                          <span>Declined: {appt.notes || 'No reason'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editingAppt}
        onSaved={() => { setFormOpen(false); load(); }}
      />

      {/* Decline reason modal */}
      <Dialog open={declineModal.open} onOpenChange={(open) => setDeclineModal({ ...declineModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason why this appointment cannot be accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., No available mechanic, shop closed, etc."
                value={declineModal.reason}
                onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineModal({ open: false, appointment: null, reason: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline}>
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}