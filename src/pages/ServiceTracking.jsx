import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Car, Wrench, Eye, Play } from 'lucide-react';
import { appointmentsApi } from '@/api/appointmentsApi';
import { notify } from '@/lib/notify';
import ServiceDetailPanel from '@/components/service-tracking/ServiceDetailPanel';

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hour, minute] = time24.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

export default function ServiceTracking() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list();
      const all = res.data?.data || [];
      const active = all.filter(apt => apt.status === 'CONFIRMED' || apt.status === 'UNDER_INSPECTION');
      setAppointments(active);
    } catch (err) {
      console.error('Failed to load active appointments:', err);
      notify.error('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInspect = async (appt) => {
    if (appt.status === 'UNDER_INSPECTION') {
      setSelected(appt);
      return;
    }
    try {
      await appointmentsApi.updateStatus(appt.id, 'UNDER_INSPECTION', 'Inspection started');
      notify.success('Inspection started');
      await load();
      const updatedRes = await appointmentsApi.get(appt.id);
      const updatedAppt = updatedRes.data?.data || appt;
      setSelected(updatedAppt);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to start inspection');
    }
  };

  const handleBack = () => {
    setSelected(null);
    load();
  };

  const handleStatusChanged = () => {
    load();
  };

  if (selected) {
    return (
      <ServiceDetailPanel
        appointment={selected}
        onBack={handleBack}
        onStatusChanged={handleStatusChanged}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer
      title="Service Tracking"
      subtitle="Active services (confirmed & under inspection)"
    >
      {appointments.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No active services"
          description="Confirmed or under‑inspection appointments will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="overflow-hidden hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold truncate flex-1">
                    {appt.vehicle?.make || '?'} {appt.vehicle?.model || ''} ({appt.vehicle?.year || 'N/A'})
                  </CardTitle>
                  <StatusBadge status={appt.status || 'PENDING'} />
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-3 h-3 mr-1" />
                  {appt.customer?.fullName || 'Unknown'}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Wrench className="w-3 h-3 mr-1" />
                  {appt.serviceType?.name || 'Service'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  {appt.appointmentDate}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime12h(appt.appointmentTime)}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleInspect(appt)}
                  >
                    {appt.status === 'UNDER_INSPECTION' ? (
                      <>
                        <Play className="w-3 h-3 mr-1" /> Continue
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-1" /> Inspect
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}