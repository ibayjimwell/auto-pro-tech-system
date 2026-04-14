import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import InspectionPanel from './InspectionPanel';
import TaskList from './TaskList';
import AdditionalItemsPanel from './AdditionalItemsPanel';
import { serviceTrackingStore } from '@/services/serviceTrackingStore';
import { appointmentsApi } from '@/services/api';
import { notify } from '@/lib/notify';
import { useAutoAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ChevronRight, User, Car, Wrench, Clock, CheckCircle2 } from 'lucide-react';

const TRACKING_STATUSES = ['PENDING', 'UNDER_INSPECTION', 'WAITING_APPROVAL', 'IN_PROGRESS', 'COMPLETED'];

const STATUS_LABELS = {
  PENDING: 'Pending',
  UNDER_INSPECTION: 'Under Inspection',
  WAITING_APPROVAL: 'Waiting Approval',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function ServiceDetailPanel({ appointment, onBack, onStatusChanged }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { user } = useAutoAuth();

  const loadSession = useCallback(async () => {
    const s = await serviceTrackingStore.getSession(appointment.id, appointment);
    setSession(s);
    setLoading(false);
  }, [appointment]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const refreshSession = async () => {
    const s = await serviceTrackingStore.getSession(appointment.id, appointment);
    setSession(s);
  };

  const handleUpdateSession = async (data) => {
    await serviceTrackingStore.updateSession(appointment.id, data);
    await refreshSession();
    notify.success('Saved');
  };

  const handleAddTask = async (taskData) => {
    await serviceTrackingStore.addTask(appointment.id, taskData);
    await refreshSession();
  };

  const handleUpdateTask = async (taskId, data) => {
    await serviceTrackingStore.updateTask(appointment.id, taskId, data);
    await refreshSession();
  };

  const handleDeleteTask = async (taskId) => {
    await serviceTrackingStore.deleteTask(appointment.id, taskId);
    await refreshSession();
  };

  const handleAddSubtask = async (taskId, title) => {
    await serviceTrackingStore.addSubtask(appointment.id, taskId, title);
    await refreshSession();
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    await serviceTrackingStore.toggleSubtask(appointment.id, taskId, subtaskId);
    await refreshSession();
  };

  const handleAddProduct = async (taskId, product) => {
    const task = session.tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = [...(task.addedProducts || []), product];
    await serviceTrackingStore.updateTask(appointment.id, taskId, { addedProducts: updated });
    await refreshSession();
  };

  const handleAddAdditionalItem = async (item) => {
    await serviceTrackingStore.addAdditionalItem(appointment.id, item);
    await refreshSession();
    notify.success('Item submitted for customer approval');
  };

  const handleUpdateAdditionalItem = async (itemId, data) => {
    await serviceTrackingStore.updateAdditionalItem(appointment.id, itemId, data);
    await refreshSession();
    notify.success('Item status updated');
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    await appointmentsApi.updateStatus(appointment.id, {
      status: newStatus,
      notes: `Status updated to ${newStatus} by ${user?.fullName}`,
      changedByStaffId: user?.id,
    });
    notify.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    setUpdatingStatus(false);
    onStatusChanged(newStatus);
  };

  const currentStatusIdx = TRACKING_STATUSES.indexOf(appointment.status);
  const nextStatus = TRACKING_STATUSES[currentStatusIdx + 1] || null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0 mt-0.5 h-8 px-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold font-heading truncate">{appointment.customerName}</h2>
            <StatusBadge status={appointment.status || 'PENDING'} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Car className="w-3 h-3" /> {appointment.vehiclePlate}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wrench className="w-3 h-3" /> {appointment.serviceName}
            </span>
            {appointment.staffName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" /> {appointment.staffName}
              </span>
            )}
            {appointment.appointmentTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> {appointment.appointmentDate} · {appointment.appointmentTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Service Progress</p>
        <div className="flex items-center gap-0">
          {TRACKING_STATUSES.map((s, i) => {
            const done = currentStatusIdx > i;
            const active = currentStatusIdx === i;
            return (
              <React.Fragment key={s}>
                <button
                  onClick={() => !active && handleStatusChange(s)}
                  disabled={updatingStatus || active}
                  className={`flex flex-col items-center gap-1 px-1 flex-1 min-w-0 transition-opacity ${active ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${done ? 'bg-primary' : active ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted'}`}>
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : <span className={`text-xs font-bold ${active ? 'text-white' : 'text-muted-foreground'}`}>{i + 1}</span>
                    }
                  </div>
                  <span className={`text-[9px] text-center leading-tight hidden sm:block ${active ? 'font-bold text-primary' : done ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </button>
                {i < TRACKING_STATUSES.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-colors ${done ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {nextStatus && (
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updatingStatus}
              className="bg-primary hover:bg-primary/90 text-sm"
            >
              {updatingStatus ? 'Updating...' : `Move to: ${STATUS_LABELS[nextStatus]}`}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Detail sections */}
      <InspectionPanel session={session} onUpdate={handleUpdateSession} />
      <TaskList
        session={session}
        appointmentId={appointment.id}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onAddProduct={handleAddProduct}
      />
      <AdditionalItemsPanel
        session={session}
        onAdd={handleAddAdditionalItem}
        onUpdateItem={handleUpdateAdditionalItem}
      />
    </div>
  );
}