import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ServiceTrackingCard from '@/components/service-tracking/ServiceTrackingCard';
import ServiceDetailPanel from '@/components/service-tracking/ServiceDetailPanel';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';
import { appointmentsApi } from '@/services/api';

const FILTER_STATUSES = ['ALL', 'PENDING', 'UNDER_INSPECTION', 'WAITING_APPROVAL', 'IN_PROGRESS'];

const FILTER_LABELS = {
  ALL: 'All Active',
  PENDING: 'Pending',
  UNDER_INSPECTION: 'Inspecting',
  WAITING_APPROVAL: 'Waiting Approval',
  IN_PROGRESS: 'In Progress',
};

export default function ServiceTracking() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null); // appointment being viewed

  const load = useCallback(async () => {
    let data;
    if (filter === 'ALL') {
      const all = await appointmentsApi.list();
      data = all.filter(a => ['PENDING', 'UNDER_INSPECTION', 'WAITING_APPROVAL', 'IN_PROGRESS'].includes(a.status));
    } else {
      data = await appointmentsApi.getTracking(filter);
    }
    setAppointments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Auto-refresh every 15s when showing the list
  useEffect(() => {
    if (selected) return;
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load, selected]);

  const handleStatusChanged = useCallback((newStatus) => {
    // Update the selected appointment's status locally
    setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    // Also update in list
    setAppointments(prev => prev.map(a => a.id === selected?.id ? { ...a, status: newStatus } : a));
  }, [selected]);

  const handleBack = () => {
    setSelected(null);
    load(); // refresh list
  };

  return (
    <PageContainer
      title="Service Tracking"
      subtitle={selected ? `${selected.customerName} · ${selected.vehiclePlate}` : 'Real-time service progress tracking'}
      actions={
        !selected && (
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        )
      }
    >
      {selected ? (
        <ServiceDetailPanel
          appointment={selected}
          onBack={handleBack}
          onStatusChanged={handleStatusChanged}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
            <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">Filter:</span>
            <div className="flex gap-2 flex-wrap">
              {FILTER_STATUSES.map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={filter === s ? 'default' : 'outline'}
                  onClick={() => setFilter(s)}
                  className={filter === s ? 'bg-primary' : ''}
                >
                  {FILTER_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No active services"
              description="No appointments currently being tracked"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {appointments.map(appt => (
                <ServiceTrackingCard
                  key={appt.id}
                  appointment={appt}
                  onClick={() => setSelected(appt)}
                />
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center mt-6">
            Auto-refreshing every 15 seconds
          </p>
        </>
      )}
    </PageContainer>
  );
}