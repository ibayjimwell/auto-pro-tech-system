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
import { estimateApi } from "@/api/estimateApi";
import { additionalCostsApi } from "@/api/additionalCostsApi";
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
  "WAITING_FOR_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
];

const STATUS_LABELS = {
  PENDING: "Pending",
  UNDER_INSPECTION: "Under Inspection",
  WAITING_FOR_APPROVAL: "Waiting Approval",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function ServiceDetailPanel({
  appointment: initialAppointment,
  onBack,
  onStatusChanged,
}) {
  const [appointment, setAppointment] = useState(initialAppointment);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [sendingCost, setSendingCost] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [laborItems, setLaborItems] = useState([]); // for UNDER_INSPECTION only
  const [discounts, setDiscounts] = useState([]);
  const [additionalCosts, setAdditionalCosts] = useState([]); // for IN_PROGRESS
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [additionalPartModalOpen, setAdditionalPartModalOpen] = useState(false);
  const [newAdditionalAmount, setNewAdditionalAmount] = useState("");
  const [newAdditionalDesc, setNewAdditionalDesc] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("fixed");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const { user } = useAutoAuth();

  const isInProgress = appointment.status === "IN_PROGRESS";

  // Sync when prop changes
  useEffect(() => {
    setAppointment(initialAppointment);
  }, [initialAppointment]);

  // Load tasks
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

  // Load estimate adjustments (only for UNDER_INSPECTION)
  const loadAdjustments = useCallback(async () => {
    if (isInProgress) return;
    try {
      const res = await estimateApi.get(appointment.id);
      const adjustments = res.data?.data || [];
      const labors = adjustments.filter(a => a.type === 'labor');
      const disc = adjustments.filter(a => a.type === 'discount');
      setLaborItems(labors.map(l => ({ id: l.id, amount: parseFloat(l.amount) })));
      setDiscounts(disc.map(d => ({ id: d.id, type: d.discountType, value: parseFloat(d.discountValue) })));
    } catch (err) {
      console.error("Failed to load adjustments:", err);
    }
  }, [appointment.id, isInProgress]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  // Load additional costs (for IN_PROGRESS)
  const loadAdditionalCosts = useCallback(async () => {
    if (!isInProgress) return;
    try {
      const res = await additionalCostsApi.get(appointment.id);
      setAdditionalCosts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load additional costs:", err);
    }
  }, [appointment.id, isInProgress]);

  useEffect(() => {
    loadAdditionalCosts();
  }, [loadAdditionalCosts]);

  // WebSocket for tasks, estimate updates, additional costs
  useEffect(() => {
    const socketUrl = BASE_URL.replace("/api/v1", "");
    const socket = io(socketUrl, { transports: ["websocket"] });

    const handleTaskChange = (data) => {
      if (data.appointmentId === appointment.id) loadTasks();
    };
    const handleFindingChange = () => loadTasks();
    const handleProductChange = () => loadTasks();
    const handleEstimateUpdate = (data) => {
      if (data.appointmentId !== appointment.id) return;
      loadAdjustments();
    };
    const handleAppointmentChange = (data) => {
      if (data.appointment?.id === appointment.id && data.type === 'statusChanged') {
        setAppointment(prev => ({ ...prev, status: data.appointment.status }));
        if (onStatusChanged) onStatusChanged(data.appointment.status);
      }
    };
    const handleAdditionalCostChange = (data) => {
      if (data.appointmentId === appointment.id) {
        loadAdditionalCosts();
      }
    };

    socket.on("taskChanged", handleTaskChange);
    socket.on("findingAdded", handleFindingChange);
    socket.on("findingDeleted", handleFindingChange);
    socket.on("productAdded", handleProductChange);
    socket.on("productDeleted", handleProductChange);
    socket.on("estimateUpdated", handleEstimateUpdate);
    socket.on("appointmentChanged", handleAppointmentChange);
    socket.on("additionalCostAdded", handleAdditionalCostChange);
    socket.on("additionalCostRemoved", handleAdditionalCostChange);

    return () => socket.disconnect();
  }, [appointment.id, loadTasks, loadAdjustments, loadAdditionalCosts, onStatusChanged]);

  // Compute initial cost (service + parts) for UNDER_INSPECTION
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
    discounts: computedDiscounts,
    grandTotal: initialGrandTotal,
  } = computeCosts();

  // Compute additional costs total
  const additionalTotal = additionalCosts.reduce((sum, c) => {
    if (c.type === 'discount') {
      // Discount amount already stored in 'amount' field for fixed, but for percentage we need to calculate on the fly?
      // We use the stored amount for simplicity.
      return sum - Number(c.amount);
    }
    return sum + Number(c.amount);
  }, 0);

  const totalCost = isInProgress ? initialGrandTotal + additionalTotal : initialGrandTotal;

  const hasAnyDoneTask = tasks.some((t) => t.status === "DONE");

  // Handlers for additional costs
  const addAdditionalLabor = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error("Enter valid amount");
      return;
    }
    try {
      await additionalCostsApi.addLabor(appointment.id, { amount, description: newAdditionalDesc || 'Labor' });
      setNewAdditionalAmount("");
      setNewAdditionalDesc("");
      setLaborModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to add labor");
    }
  };

  const addAdditionalPart = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error("Enter valid amount");
      return;
    }
    try {
      await additionalCostsApi.addPart(appointment.id, { amount, description: newAdditionalDesc || 'Part' });
      setNewAdditionalAmount("");
      setNewAdditionalDesc("");
      setAdditionalPartModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to add part");
    }
  };

  const addAdditionalDiscount = async () => {
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) {
      notify.error("Enter valid value");
      return;
    }
    if (newDiscountType === "percentage" && value > 100) {
      notify.error("Percentage cannot exceed 100");
      return;
    }
    try {
      await additionalCostsApi.addDiscount(appointment.id, {
        discountType: newDiscountType,
        discountValue: value,
        description: newAdditionalDesc || 'Discount',
      });
      setNewDiscountValue("");
      setNewAdditionalDesc("");
      setDiscountModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to add discount");
    }
  };

  const removeAdditionalCost = async (id) => {
    try {
      await additionalCostsApi.remove(id);
    } catch (err) {
      notify.error("Failed to remove");
    }
  };

  // Send approval request (only for UNDER_INSPECTION)
  const confirmSendInitialCost = async () => {
    setSendingCost(true);
    setSendConfirmOpen(false);
    try {
      const details = `Initial estimate for ${appointment.serviceType.name}\n
Parts:\n${partsItems.map(p => `${p.quantity}x ${p.name} ₱${p.subtotal.toFixed(2)}`).join('\n')}\n
Labor:\n${computedLaborItems.map(l => `₱${l.amount.toFixed(2)}`).join('\n')}\n
Discounts:\n${computedDiscounts.map(d => d.type === 'percentage' ? `${d.value}%` : `₱${d.value}`).join('\n')}\n`;
      await invoicesApi.create({
        appointmentId: appointment.id,
        invoiceType: "ESTIMATE",
        status: "PENDING_APPROVAL",
        totalAmount: initialGrandTotal,
        details,
      });
      notify.success("Initial invoice created, waiting for customer approval");
      await appointmentsApi.updateStatus(appointment.id, "WAITING_FOR_APPROVAL", "Initial invoice sent");
      setAppointment(prev => ({ ...prev, status: "WAITING_FOR_APPROVAL" }));
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
      setAppointment(prev => ({ ...prev, status: newStatus }));
      if (onStatusChanged) onStatusChanged(newStatus);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStatusIdx = TRACKING_STATUSES.indexOf(appointment.status);

  if (loading) return <LoadingSpinner />;

  const showSendButton = appointment.status === "UNDER_INSPECTION" &&
    (hasAnyDoneTask || servicePrice > 0 || laborItems.length > 0);

  return (
    <div className="space-y-4 m-6">
      {/* Header (unchanged) */}
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

      {/* Progress stepper (unchanged) */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Service Progress</p>
        <div className="flex items-center gap-0">
          {TRACKING_STATUSES.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex flex-col items-center gap-1 px-1 flex-1 min-w-0 transition-opacity ${currentStatusIdx === i ? "opacity-100" : "opacity-60"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                  currentStatusIdx > i ? "bg-primary" : currentStatusIdx === i ? "bg-primary ring-4 ring-primary/20" : "bg-muted"
                }`}>
                  {currentStatusIdx > i ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className={`text-xs font-bold ${currentStatusIdx === i ? "text-white" : "text-muted-foreground"}`}>{i + 1}</span>}
                </div>
                <span className={`text-[9px] text-center leading-tight hidden sm:block ${currentStatusIdx === i ? "font-bold text-primary" : "text-muted-foreground"}`}>
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < TRACKING_STATUSES.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${currentStatusIdx > i ? "bg-primary" : "bg-muted"}`} />}
            </React.Fragment>
          ))}
        </div>
        {appointment.status === "UNDER_INSPECTION" && appointment.status !== "WAITING_FOR_APPROVAL" && appointment.status !== "IN_PROGRESS" && (
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => handleStatusChange("IN_PROGRESS")} className="bg-primary">
              Move to In Progress
            </Button>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            🛠️ {isInProgress ? "Repair Tasks" : "Inspection Tasks"}
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
                onUpdate={(updates) => inspectionApi.updateTask(task.id, updates).then(loadTasks)}
                onDelete={async (id) => {
                  await inspectionApi.deleteTask(id);
                  loadTasks();
                }}
                appointmentId={appointment.id}
                isInProgress={isInProgress}
              />
            ))}
          </div>
        )}
      </div>

      {/* Costing Section */}
      {!isInProgress ? (
        // UNDER_INSPECTION: Initial Costing
        (servicePrice > 0 || partsItems.length > 0 || laborItems.length > 0 || discounts.length > 0) && (
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
                  <td className="py-2 font-medium">{appointment.serviceType.name}</td>
                  <td className="text-right">1</td>
                  <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>

                {partsItems.length > 0 && (
                  <>
                    <tr className="bg-muted/20"><td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Parts / Supplies</td></tr>
                    {partsItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-2">{item.name}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">₱{item.unitPrice.toLocaleString(undefined, { minFrac: 2 })}</td>
                        <td className="text-right">₱{item.subtotal.toLocaleString(undefined, { minFrac: 2 })}</td>
                      </tr>
                    ))}
                  </>
                )}

                {computedLaborItems.length > 0 && (
                  <>
                    <tr className="bg-muted/20"><td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Labor Charges</td></tr>
                    {computedLaborItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2 flex justify-between">
                          Labor
                          <button onClick={() => estimateApi.removeLabor(item.id).then(loadAdjustments)} className="text-red-500 ml-2"><Trash2 className="w-3 h-3" /></button>
                        </td>
                        <td className="text-right">1</td>
                        <td className="text-right">₱{item.amount.toLocaleString(undefined, { minFrac: 2 })}</td>
                        <td className="text-right">₱{item.amount.toLocaleString(undefined, { minFrac: 2 })}</td>
                      </tr>
                    ))}
                  </>
                )}

                {computedDiscounts.length > 0 && (
                  <>
                    <tr className="bg-muted/20"><td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Discounts</td></tr>
                    {computedDiscounts.map((disc) => (
                      <tr key={disc.id} className="border-b border-border/50">
                        <td className="py-2 flex justify-between">
                          {disc.type === "percentage" ? `${disc.value}% discount` : `Fixed discount (₱${disc.value})`}
                          <button onClick={() => estimateApi.removeDiscount(disc.id).then(loadAdjustments)} className="text-red-500 ml-2"><Trash2 className="w-3 h-3" /></button>
                        </td>
                        <td className="text-right">1</td>
                        <td className="text-right">-₱{disc.amount.toLocaleString(undefined, { minFrac: 2 })}</td>
                        <td className="text-right">-₱{disc.amount.toLocaleString(undefined, { minFrac: 2 })}</td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="font-bold border-t border-border">
                  <td colSpan="3" className="text-right py-2">Total</td>
                  <td className="text-right">₱{initialGrandTotal.toLocaleString(undefined, { minFrac: 2 })}</td>
                </tr>
              </tbody>
            </table>

            {showSendButton && (
              <div className="flex justify-end pt-3">
                <Button onClick={handleSendInitialCost} disabled={sendingCost} className="bg-primary">
                  {sendingCost ? "Sending..." : "Send Approval Request"}
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        // IN_PROGRESS: Additional Costing
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Additional Costing
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setLaborModalOpen(true)}>
                <PlusCircle className="w-3 h-3 mr-1" /> Add Labor
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdditionalPartModalOpen(true)}>
                <PlusCircle className="w-3 h-3 mr-1" /> Add Part
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
                <th className="text-right py-2">Amount</th>
                <th className="text-right py-2"></th>
              </tr>
            </thead>
            <tbody>
              {additionalCosts.length === 0 && (
                <tr><td colSpan="3" className="text-center py-4 text-muted-foreground">No additional costs yet</td></tr>
              )}
              {additionalCosts.map((cost) => (
                <tr key={cost.id} className="border-b border-border/50">
                  <td className="py-2">{cost.description || cost.type}</td>
                  <td className="text-right">₱{cost.amount.toLocaleString(undefined, { minFrac: 2 })}</td>
                  <td className="text-right">
                    <button onClick={() => removeAdditionalCost(cost.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t border-border">
                <td className="text-right py-2">Additional Total</td>
                <td className="text-right">₱{additionalTotal.toLocaleString(undefined, { minFrac: 2 })}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div className="text-right text-sm font-semibold">
            Original Estimate: ₱{initialGrandTotal.toLocaleString(undefined, { minFrac: 2 })}<br/>
            Total with extras: ₱{totalCost.toLocaleString(undefined, { minFrac: 2 })}
          </div>
        </div>
      )}

      <AddTaskModal open={addTaskModalOpen} onOpenChange={setAddTaskModalOpen} onAddTask={async (title) => {
        await inspectionApi.createTask(appointment.id, { title });
        loadTasks();
      }} />

      <ConfirmationDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Send Approval Request"
        description={`Are you sure you want to send the initial estimate for ₱${initialGrandTotal.toLocaleString(undefined, { minFrac: 2 })} to the customer?`}
        onConfirm={confirmSendInitialCost}
        confirmText="Yes, Send"
      />

      {/* Modals for Additional Costing */}
      <Dialog open={laborModalOpen} onOpenChange={setLaborModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Labor Charge</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Amount (₱)</Label>
            <Input type="number" step="0.01" value={newAdditionalAmount} onChange={e => setNewAdditionalAmount(e.target.value)} />
            <Label>Description (optional)</Label>
            <Input value={newAdditionalDesc} onChange={e => setNewAdditionalDesc(e.target.value)} placeholder="e.g., Extra mechanic hours" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaborModalOpen(false)}>Cancel</Button>
            <Button onClick={addAdditionalLabor} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={additionalPartModalOpen} onOpenChange={setAdditionalPartModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Extra Part</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Amount (₱)</Label>
            <Input type="number" step="0.01" value={newAdditionalAmount} onChange={e => setNewAdditionalAmount(e.target.value)} />
            <Label>Description (optional)</Label>
            <Input value={newAdditionalDesc} onChange={e => setNewAdditionalDesc(e.target.value)} placeholder="e.g., Replacement belt" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdditionalPartModalOpen(false)}>Cancel</Button>
            <Button onClick={addAdditionalPart} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Discount</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={newDiscountType} onValueChange={setNewDiscountType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
              </SelectContent>
            </Select>
            <Label>{newDiscountType === "fixed" ? "Amount (₱)" : "Percentage (%)"}</Label>
            <Input type="number" step={newDiscountType === "fixed" ? "0.01" : "1"} value={newDiscountValue} onChange={e => setNewDiscountValue(e.target.value)} />
            <Label>Description (optional)</Label>
            <Input value={newAdditionalDesc} onChange={e => setNewAdditionalDesc(e.target.value)} placeholder="e.g., Loyalty discount" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountModalOpen(false)}>Cancel</Button>
            <Button onClick={addAdditionalDiscount} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}