import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TaskCard from "./TaskCard";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import AddTaskModal from "@/components/ui/AddTaskModal";
import { appointmentsApi } from "@/api/appointmentsApi";
import { inspectionApi } from "@/api/inspectionApi";
import { invoicesApi } from "@/api/invoicesApi";
import { notify } from "@/lib/notify";
import { useAutoAuth } from "@/contexts/AuthContext";
import io from "socket.io-client";
import { BASE_URL } from "@/api/client";
import {
  ArrowLeft,
  User,
  Car,
  Wrench,
  Clock,
  CheckCircle2,
  Plus,
  Receipt,
} from "lucide-react";

const TRACKING_STATUSES = [
  "PENDING",
  "UNDER_INSPECTION",
  "WAITING_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
];

const STATUS_LABELS = {
  PENDING: "Pending",
  UNDER_INSPECTION: "Under Inspection",
  WAITING_APPROVAL: "Waiting Approval",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function ServiceDetailPanel({
  appointment,
  onBack,
  onStatusChanged,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [sendingCost, setSendingCost] = useState(false);
  const { user } = useAutoAuth();

  const loadTasks = useCallback(async () => {
    try {
      const res = await inspectionApi.getTasks(appointment.id);
      setTasks(res.data.data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      notify.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [appointment.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // WebSocket real‑time updates (reload tasks on any change)
  useEffect(() => {
    const socketUrl = BASE_URL.replace("/api/v1", "");
    const socket = io(socketUrl, { transports: ["websocket"] });

    const handleTaskChange = (data) => {
      if (data.appointmentId === appointment.id) loadTasks();
    };
    const handleFindingChange = () => loadTasks();
    const handleProductChange = () => loadTasks();

    socket.on("taskChanged", handleTaskChange);
    socket.on("findingAdded", handleFindingChange);
    socket.on("findingDeleted", handleFindingChange);
    socket.on("productAdded", handleProductChange);
    socket.on("productDeleted", handleProductChange);

    return () => socket.disconnect();
  }, [appointment.id, loadTasks]);

  // Task CRUD
  const handleAddTask = async (title) => {
    try {
      await inspectionApi.createTask(appointment.id, { title });
      notify.success("Task added");
      loadTasks();
    } catch (err) {
      notify.error("Failed to add task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await inspectionApi.updateTask(taskId, updates);
      await loadTasks();
    } catch (err) {
      notify.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await inspectionApi.deleteTask(taskId);
      notify.success("Task deleted");
      loadTasks();
    } catch (err) {
      notify.error("Failed to delete task");
    }
  };

  // Compute initial costs: service price + parts from DONE tasks
  const computeCosts = () => {
    const servicePrice = parseFloat(appointment.serviceType.basePrice) || 0;
    let partsTotal = 0;
    const partsItems = [];

    tasks.forEach((task) => {
      if (task.status === "DONE" && task.findings) {
        task.findings.forEach((finding) => {
          if (finding.products && finding.products.length) {
            finding.products.forEach((prod) => {
              const qty = prod.quantity || 1;
              const unitPrice = parseFloat(prod.priceAtTime) || 0;
              const subtotal = qty * unitPrice;
              partsTotal += subtotal;
              partsItems.push({
                name: prod.name,
                quantity: qty,
                unitPrice,
                subtotal,
              });
            });
          }
        });
      }
    });

    return { servicePrice, partsTotal, partsItems, grandTotal: servicePrice + partsTotal };
  };

  const { servicePrice, partsItems, partsTotal, grandTotal } = computeCosts();
  const hasAnyDoneTask = tasks.some((t) => t.status === "DONE");

  const handleSendInitialCost = async () => {
    if (!hasAnyDoneTask && servicePrice === 0) {
      notify.error("No costs to invoice.");
      return;
    }
    setSendingCost(true);
    try {
      // Create initial invoice (estimate, pending approval)
      const details = `Initial estimate for ${appointment.serviceType.name}\nParts: ${partsItems.map(p => `${p.quantity}x ${p.name}`).join(', ')}`;
      await invoicesApi.create({
        appointmentId: appointment.id,
        invoiceType: "ESTIMATE",
        status: "PENDING_APPROVAL",
        totalAmount: grandTotal,
        details,
        issuedByStaffId: user?.id,
      });
      notify.success("Initial invoice created, waiting for customer approval");
      // Change appointment status to WAITING_APPROVAL
      await appointmentsApi.updateStatus(appointment.id, "WAITING_FOR_APPROVAL", "Initial invoice sent");
      if (onStatusChanged) onStatusChanged("WAITING_FOR_APPROVAL");
      onBack(); // go back to tracking list
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setSendingCost(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === "UNDER_INSPECTION") await loadTasks();
    setUpdatingStatus(true);
    try {
      await appointmentsApi.updateStatus(appointment.id, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by ${user?.fullName}`,
        changedByStaffId: user?.id,
      });
      notify.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
      onStatusChanged(newStatus);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStatusIdx = TRACKING_STATUSES.indexOf(appointment.status);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 m-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0 mt-0.5 h-8 px-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold font-heading truncate">
              {appointment.customer.fullName}
            </h2>
            <StatusBadge status={appointment.status || "PENDING"} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Car className="w-3 h-3" /> {appointment.vehicle.plateNumber}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wrench className="w-3 h-3" /> {appointment.serviceType.name}
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

      {/* Progress stepper (without the "Move to" button) */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Service Progress</p>
        <div className="flex items-center gap-0">
          {TRACKING_STATUSES.map((s, i) => {
            const done = currentStatusIdx > i;
            const active = currentStatusIdx === i;
            return (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center gap-1 px-1 flex-1 min-w-0 transition-opacity ${active ? "opacity-100" : "opacity-60"}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                      done ? "bg-primary" : active ? "bg-primary ring-4 ring-primary/20" : "bg-muted"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className={`text-xs font-bold ${active ? "text-white" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] text-center leading-tight hidden sm:block ${
                      active ? "font-bold text-primary" : done ? "text-muted-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < TRACKING_STATUSES.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-colors ${done ? "bg-primary" : "bg-muted"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            🛠️ Inspection Tasks
            <Badge variant="secondary" className="text-xs">
              {tasks.filter((t) => t.status === "DONE").length}/{tasks.length} done
            </Badge>
          </h3>
          <Button size="sm" variant="outline" onClick={() => setAddTaskModalOpen(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add Task
          </Button>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No tasks yet. Click "Add Task" to start.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={(updates) => handleUpdateTask(task.id, updates)}
                onDelete={handleDeleteTask}
                appointmentId={appointment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Initial Costing Section (only shown when there are costs or done tasks) */}
      {(servicePrice > 0 || partsItems.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Initial Costing
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2">{appointment.serviceType.name}</td>
                <td className="text-right">1</td>
                <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              {partsItems.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-2">{item.name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">₱{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="text-right">₱{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan="3" className="text-right py-2">Total</td>
                <td className="text-right">₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-end">
            <Button
              onClick={handleSendInitialCost}
              disabled={sendingCost || (!hasAnyDoneTask && servicePrice === 0)}
              className="bg-primary hover:bg-primary/90"
            >
              {sendingCost ? "Sending..." : "Send Approval Request"}
            </Button>
          </div>
        </div>
      )}

      <AddTaskModal
        open={addTaskModalOpen}
        onOpenChange={setAddTaskModalOpen}
        onAddTask={handleAddTask}
      />
    </div>
  );
}