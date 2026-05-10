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
import { useAppointmentsSocket } from '@/hooks/useAppointmentsSocket';

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hour, minute] = time24.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

// ✅ Corrected status strings to match backend enum
const FILTER_OPTIONS = [
  { value: 'CONFIRMED', label: 'Confirmed', color: 'primary' },
  { value: 'UNDER_INSPECTION', label: 'Under Inspection', color: 'warning' },
  { value: 'WAITING_FOR_APPROVAL', label: 'Waiting Approval', color: 'info' },  // fixed
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'success' },
];

export default function ServiceTracking() {
  const [allAppointments, setAllAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState('CONFIRMED');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list();
      const all = res.data?.data || [];
      // Keep only the statuses we care about – using the correct strings
      const relevant = all.filter(apt =>
        ['CONFIRMED', 'UNDER_INSPECTION', 'WAITING_FOR_APPROVAL', 'IN_PROGRESS'].includes(apt.status)
      );
      setAllAppointments(relevant);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      notify.error('Failed to load appointments');
      setAllAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time update listener - refreshes list when appointments change
  useAppointmentsSocket(({ type, appointment }) => {
    if (type === 'statusChanged' || type === 'created' || type === 'cancelled' || type === 'updated') {
      const relevantStatuses = ['CONFIRMED', 'UNDER_INSPECTION', 'WAITING_FOR_APPROVAL', 'IN_PROGRESS'];
      if (appointment && relevantStatuses.includes(appointment.status)) {
        // If we're viewing a specific appointment in detail, let the ServiceDetailPanel handle it
        if (!selected) {
          load();
        }
      } else if (type === 'cancelled') {
        // If an appointment was cancelled, remove it from the list
        setAllAppointments(prev => prev.filter(a => a.id !== appointment?.id));
      }
    }
  });

  useEffect(() => {
    setFilteredAppointments(allAppointments.filter(apt => apt.status === activeFilter));
  }, [allAppointments, activeFilter]);

  const handleInspect = async (appt) => {
    // For confirmed appointments, start inspection
    if (appt.status === 'CONFIRMED') {
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
    } else {
      // For any other status (UNDER_INSPECTION, WAITING_FOR_APPROVAL, IN_PROGRESS) just open the detail panel
      setSelected(appt);
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
      subtitle="Track active service jobs"
    >
      {/* Filter Navbar */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeFilter === opt.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={Car}
          title={`No ${FILTER_OPTIONS.find(f => f.value === activeFilter)?.label} appointments`}
          description="Appointments in this status will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appt) => (
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
                    {appt.status === 'CONFIRMED' ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" /> Inspect
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" /> Continue
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