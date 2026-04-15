import React, { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { appointmentsApi } from '@/services/api';
import { notify } from '@/lib/notify';
import { format, isSameDay } from 'date-fns';

const STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  const load = async () => {
    try {
      const data = await appointmentsApi.list();
      setAppointments(Array.isArray(data) ? data : []);
    } catch { setAppointments([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const dayAppointments = selectedDate
    ? appointments.filter(a => a.appointmentDate && isSameDay(new Date(a.appointmentDate), selectedDate))
    : [];

  const handleStatusChange = async (appt, newStatus) => {
    try {
      await appointmentsApi.updateStatus(appt.id, { status: newStatus, notes: `Status changed to ${newStatus}` });
      notify.success(`Status updated to ${newStatus}`);
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await appointmentsApi.delete(id);
      notify.success('Appointment cancelled');
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
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

        {/* Day Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Click on a date to see appointments</p>
            ) : dayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No appointments for this date</p>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map(a => (
                  <div key={a.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{a.customerName || 'Customer'}</p>
                        <p className="text-xs text-muted-foreground">{a.appointmentTime}</p>
                      </div>
                      <StatusBadge status={a.status || 'PENDING'} />
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mb-2">{a.notes}</p>}
                    <div className="flex items-center gap-1 mt-2">
                      <Select onValueChange={(v) => handleStatusChange(a, v)}>
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAppt(a); setFormOpen(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
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
    </PageContainer>
  );
}