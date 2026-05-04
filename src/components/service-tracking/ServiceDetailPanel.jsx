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
  PlusCircle,
  Percent,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const { user } = useAutoAuth();

  // Labor and discount state
  const [laborItems, setLaborItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [newLaborAmount, setNewLaborAmount] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("fixed");
  const [newDiscountValue, setNewDiscountValue] = useState("");

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

  // WebSocket real‑time updates
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

  // Compute costs
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

    const laborTotal = laborItems.reduce((sum, item) => sum + item.amount, 0);
    const preDiscountTotal = servicePrice + partsTotal + laborTotal;

    let discountTotal = 0;
    const discountDetails = discounts.map(d => {
      let amount = 0;
      if (d.type === "percentage") {
        amount = preDiscountTotal * (d.value / 100);
      } else {
        amount = d.value;
      }
      discountTotal += amount;
      return { ...d, amount };
    });

    const grandTotal = preDiscountTotal - discountTotal;

    return {
      servicePrice,
      partsItems,
      partsTotal,
      laborItems,
      laborTotal,
      discounts: discountDetails,
      discountTotal,
      preDiscountTotal,
      grandTotal,
    };
  };

  const {
    servicePrice,
    partsItems,
    laborItems: computedLaborItems,
    laborTotal,
    discounts: computedDiscounts,
    discountTotal,
    preDiscountTotal,
    grandTotal,
  } = computeCosts();
  const hasAnyDoneTask = tasks.some((t) => t.status === "DONE");

  // Labor handlers
  const addLabor = () => {
    const amount = parseFloat(newLaborAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error("Please enter a valid positive amount.");
      return;
    }
    setLaborItems([...laborItems, { id: Date.now(), amount }]);
    setNewLaborAmount("");
    setLaborModalOpen(false);
  };

  const removeLabor = (id) => {
    setLaborItems(laborItems.filter(item => item.id !== id));
  };

  // Discount handlers
  const addDiscount = () => {
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) {
      notify.error("Please enter a valid positive value.");
      return;
    }
    if (newDiscountType === "percentage" && value > 100) {
      notify.error("Percentage discount cannot exceed 100%");
      return;
    }
    setDiscounts([...discounts, { id: Date.now(), type: newDiscountType, value }]);
    setNewDiscountValue("");
    setDiscountModalOpen(false);
  };

  const removeDiscount = (id) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  // Send invoice
  const confirmSendInitialCost = async () => {
    setSendingCost(true);
    setSendConfirmOpen(false);
    try {
      const details = `Initial estimate for ${appointment.serviceType.name}\n
Parts:\n${partsItems.map(p => `${p.quantity}x ${p.name} ₱${p.subtotal}`).join('\n')}\n
Labor:\n${laborItems.map(l => `₱${l.amount}`).join('\n')}\n
Discounts:\n${discounts.map(d => d.type === 'percentage' ? `${d.value}%` : `₱${d.value}`).join('\n')}\n`;
      await invoicesApi.create({
        appointmentId: appointment.id,
        invoiceType: "ESTIMATE",
        status: "PENDING_APPROVAL",
        totalAmount: grandTotal,
        details,
        // issuedByStaffId: user?.id,
      });
      notify.success("Initial invoice created, waiting for customer approval");
      await appointmentsApi.updateStatus(appointment.id, "WAITING_FOR_APPROVAL", "Initial invoice sent");
      if (onStatusChanged) onStatusChanged("WAITING_FOR_APPROVAL");
      onBack();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setSendingCost(false);
    }
  };

  const handleSendInitialCost = () => {
    if (!hasAnyDoneTask && servicePrice === 0 && laborItems.length === 0) {
      notify.error("No costs to invoice.");
      return;
    }
    setSendConfirmOpen(true);
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

      {/* Progress stepper */}
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
                    {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className={`text-xs font-bold ${active ? "text-white" : "text-muted-foreground"}`}>{i + 1}</span>}
                  </div>
                  <span className={`text-[9px] text-center leading-tight hidden sm:block ${active ? "font-bold text-primary" : done ? "text-muted-foreground" : "text-muted-foreground"}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < TRACKING_STATUSES.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${done ? "bg-primary" : "bg-muted"}`} />}
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
          <div className="text-center py-6 text-muted-foreground text-sm">No tasks yet. Click "Add Task" to start.</div>
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

      {/* Initial Costing Section */}
      {(servicePrice > 0 || partsItems.length > 0 || laborItems.length > 0 || discounts.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Initial Costing
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setLaborModalOpen(true)}>
                <PlusCircle className="w-3 h-3 mr-1" /> Add Labor
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDiscountModalOpen(true)}>
                <Percent className="w-3 h-3 mr-1" /> Add Discount
              </Button>
            </div>
          </div>
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
              {/* Service row */}
              <tr className="border-b border-border/50">
                <td className="py-2 font-medium">{appointment.serviceType.name}</td>
                <td className="text-right">1</td>
                <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>

              {/* Parts row */}
              {partsItems.length > 0 && (
                <>
                  <tr className="bg-muted/20">
                    <td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Parts / Supplies</td>
                  </tr>
                  {partsItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2">{item.name}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">₱{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="text-right">₱{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </>
              )}

              {/* Labor section */}
              {computedLaborItems.length > 0 && (
                <>
                  <tr className="bg-muted/20">
                    <td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Labor Charges</td>
                  </tr>
                  {computedLaborItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2 flex justify-between">
                        Labor
                        <button onClick={() => removeLabor(item.id)} className="text-red-500 hover:text-red-700 ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="text-right">1</td>
                      <td className="text-right">₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="text-right">₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </>
              )}

              {/* Discounts section */}
              {computedDiscounts.length > 0 && (
                <>
                  <tr className="bg-muted/20">
                    <td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Discounts</td>
                  </tr>
                  {computedDiscounts.map((disc) => (
                    <tr key={disc.id} className="border-b border-border/50">
                      <td className="py-2 flex justify-between">
                        {disc.type === "percentage" ? `${disc.value}% discount` : `Fixed discount (₱${disc.value})`}
                        <button onClick={() => removeDiscount(disc.id)} className="text-red-500 hover:text-red-700 ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="text-right">1</td>
                      <td className="text-right">-₱{disc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="text-right">-₱{disc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </>
              )}

              {/* Total row */}
              <tr className="font-bold border-t border-border">
                <td colSpan="3" className="text-right py-2">Total</td>
                <td className="text-right">₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <Button
              onClick={handleSendInitialCost}
              disabled={sendingCost || (!hasAnyDoneTask && servicePrice === 0 && laborItems.length === 0)}
              className="bg-primary hover:bg-primary/90"
            >
              {sendingCost ? "Sending..." : "Send Approval Request"}
            </Button>
          </div>
        </div>
      )}

      <AddTaskModal open={addTaskModalOpen} onOpenChange={setAddTaskModalOpen} onAddTask={handleAddTask} />

      {/* Confirmation modal for sending */}
      <ConfirmationDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Send Approval Request"
        description={`Are you sure that the inspection is done and you want to send the initial estimate for ₱${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} to the customer?`}
        onConfirm={confirmSendInitialCost}
        confirmText="Yes, Send"
      />

      {/* Labor Modal */}
      <Dialog open={laborModalOpen} onOpenChange={setLaborModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Labor Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (₱)</Label>
              <Input
                type="number"
                step="0.01"
                value={newLaborAmount}
                onChange={(e) => setNewLaborAmount(e.target.value)}
                placeholder="e.g., 500"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaborModalOpen(false)}>Cancel</Button>
            <Button onClick={addLabor} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Modal */}
      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newDiscountType} onValueChange={setNewDiscountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{newDiscountType === "fixed" ? "Amount (₱)" : "Percentage (%)"}</Label>
              <Input
                type="number"
                step={newDiscountType === "fixed" ? "0.01" : "1"}
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(e.target.value)}
                placeholder={newDiscountType === "fixed" ? "e.g., 200" : "e.g., 10"}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountModalOpen(false)}>Cancel</Button>
            <Button onClick={addDiscount} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}