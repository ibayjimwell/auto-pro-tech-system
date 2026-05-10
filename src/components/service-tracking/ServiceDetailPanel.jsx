import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TaskCard from "./TaskCard";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import AddTaskModal from "@/components/ui/AddTaskModal";
import TaskSelectorModal from "./TaskSelectorModal";
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
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductPicker from "./ProductPicker";

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
  const [laborItems, setLaborItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [additionalPartModalOpen, setAdditionalPartModalOpen] = useState(false);
  const [initialLaborModalOpen, setInitialLaborModalOpen] = useState(false);
  const [initialPartModalOpen, setInitialPartModalOpen] = useState(false);
  const [initialDiscountModalOpen, setInitialDiscountModalOpen] = useState(false);
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [findingDescription, setFindingDescription] = useState("");
  const [findingProducts, setFindingProducts] = useState([]);
  const [newAdditionalAmount, setNewAdditionalAmount] = useState("");
  const [newAdditionalDesc, setNewAdditionalDesc] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("fixed");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const { user } = useAutoAuth();

  const isInProgress = appointment.status === "IN_PROGRESS";

  useEffect(() => {
    setAppointment(initialAppointment);
  }, [initialAppointment]);

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

  const loadAdjustments = useCallback(async () => {
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
  }, [appointment.id]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

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
    socket.on("additionalCostApproved", handleAdditionalCostChange);
    socket.on("additionalCostDeclined", handleAdditionalCostChange);

    return () => socket.disconnect();
  }, [appointment.id, loadTasks, loadAdjustments, loadAdditionalCosts, onStatusChanged]);

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

  const additionalTotal = additionalCosts.reduce((sum, c) => {
    if (c.status === 'DECLINED') return sum;
    if (c.type === 'discount') return sum - Number(c.amount);
    return sum + Number(c.amount);
  }, 0);

  const totalCost = isInProgress ? initialGrandTotal + additionalTotal : initialGrandTotal;
  const hasAnyDoneTask = tasks.some((t) => t.status === "DONE");

  const addInitialLabor = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) { notify.error("Enter valid amount"); return; }
    try {
      await estimateApi.addLabor(appointment.id, { amount, label: newAdditionalDesc || 'Labor' });
      setNewAdditionalAmount(""); setNewAdditionalDesc(""); setInitialLaborModalOpen(false);
      loadAdjustments();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const addInitialPart = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) { notify.error("Enter valid amount"); return; }
    try {
      await estimateApi.addLabor(appointment.id, { amount, label: newAdditionalDesc || 'Part' });
      setNewAdditionalAmount(""); setNewAdditionalDesc(""); setInitialPartModalOpen(false);
      loadAdjustments();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const addInitialDiscount = async () => {
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) { notify.error("Enter valid value"); return; }
    if (newDiscountType === "percentage" && value > 100) { notify.error("Percentage cannot exceed 100"); return; }
    try {
      await estimateApi.addDiscount(appointment.id, { discountType: newDiscountType, discountValue: value, label: newAdditionalDesc || 'Discount' });
      setNewDiscountValue(""); setNewAdditionalDesc(""); setInitialDiscountModalOpen(false);
      loadAdjustments();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const addAdditionalLabor = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) { notify.error("Enter valid amount"); return; }
    try {
      await additionalCostsApi.addLabor(appointment.id, { amount, description: newAdditionalDesc || 'Labor' });
      setNewAdditionalAmount(""); setNewAdditionalDesc(""); setLaborModalOpen(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const addAdditionalPart = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) { notify.error("Enter valid amount"); return; }
    try {
      await additionalCostsApi.addPart(appointment.id, { amount, description: newAdditionalDesc || 'Part' });
      setNewAdditionalAmount(""); setNewAdditionalDesc(""); setAdditionalPartModalOpen(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const addAdditionalDiscount = async () => {
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) { notify.error("Enter valid value"); return; }
    if (newDiscountType === "percentage" && value > 100) { notify.error("Percentage cannot exceed 100"); return; }
    try {
      await additionalCostsApi.addDiscount(appointment.id, {
        discountType: newDiscountType, discountValue: value, description: newAdditionalDesc || 'Discount',
      });
      setNewDiscountValue(""); setNewAdditionalDesc(""); setDiscountModalOpen(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const removeAdditionalCost = async (id) => {
    try { await additionalCostsApi.remove(id); } catch (err) { notify.error("Failed to remove"); }
  };

  const openFindingFlow = () => {
    const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    if (activeTasks.length === 0) {
      notify.error("No active task. Please start a task before adding a finding.");
      return;
    }
    if (activeTasks.length === 1) {
      setSelectedTaskId(activeTasks[0].id);
      setFindingModalOpen(true);
    } else {
      setTaskSelectorOpen(true);
    }
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
    setTaskSelectorOpen(false);
    setFindingModalOpen(true);
  };

  const addFindingToTask = async () => {
    if (!findingDescription.trim()) { notify.error("Enter finding description"); return; }
    if (!selectedTaskId) { notify.error("No task selected"); return; }
    try {
      const partsPayload = findingProducts.map(p => ({ inventoryItemId: p.inventoryItemId, quantity: p.qty }));
      await inspectionApi.addFinding(selectedTaskId, {
        description: findingDescription.trim(),
        products: partsPayload,
      });
      notify.success("Finding attached to task.");
      setFindingDescription("");
      setFindingProducts([]);
      setFindingModalOpen(false);
      setSelectedTaskId(null);
      loadTasks();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to add finding");
    }
  };

  const handleFindingProductDeduct = (product) => {
    setFindingProducts(prev => [...prev, { ...product, id: Date.now() }]);
  };

  const removeFindingProduct = (id) => {
    setFindingProducts(prev => prev.filter(p => p.id !== id));
  };

  const confirmSendInitialCost = async () => {
    setSendingCost(true); setSendConfirmOpen(false);
    try {
      const details = `Initial estimate for ${appointment.serviceType.name}\nParts:\n${partsItems.map(p => `${p.quantity}x ${p.name} ₱${p.subtotal.toFixed(2)}`).join('\n')}\nLabor:\n${computedLaborItems.map(l => `₱${l.amount.toFixed(2)}`).join('\n')}\nDiscounts:\n${computedDiscounts.map(d => d.type === 'percentage' ? `${d.value}%` : `₱${d.value}`).join('\n')}\n`;
      await invoicesApi.create({ appointmentId: appointment.id, invoiceType: "ESTIMATE", status: "PENDING_APPROVAL", totalAmount: initialGrandTotal, details });
      notify.success("Initial invoice created, waiting for customer approval");
      await appointmentsApi.updateStatus(appointment.id, "WAITING_FOR_APPROVAL", "Initial invoice sent");
      setAppointment(prev => ({ ...prev, status: "WAITING_FOR_APPROVAL" }));
      if (onStatusChanged) onStatusChanged("WAITING_FOR_APPROVAL");
      onBack();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); } finally { setSendingCost(false); }
  };

  const handleSendInitialCost = () => {
    if (!hasAnyDoneTask && servicePrice === 0 && laborItems.length === 0) { notify.error("No costs to invoice."); return; }
    setSendConfirmOpen(true);
  };

  const currentStatusIdx = TRACKING_STATUSES.indexOf(appointment.status);

  if (loading) return <LoadingSpinner />;

  const showSendButton = appointment.status === "UNDER_INSPECTION" &&
    (hasAnyDoneTask || servicePrice > 0 || laborItems.length > 0);

  return (
    <div className="space-y-4 m-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0 mt-0.5 h-8 px-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold font-heading truncate">{appointment.customer.fullName}</h2>
            <StatusBadge status={appointment.status || "PENDING"} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Car className="w-3 h-3" /> {appointment.vehicle.plateNumber}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Wrench className="w-3 h-3" /> {appointment.serviceType.name}</span>
            {appointment.appointmentTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {appointment.appointmentDate} · {appointment.appointmentTime}</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Service Progress</p>
        <div className="flex items-center gap-0">
          {TRACKING_STATUSES.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex flex-col items-center gap-1 px-1 flex-1 min-w-0 transition-opacity ${currentStatusIdx === i ? "opacity-100" : "opacity-60"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${currentStatusIdx > i ? "bg-primary" : currentStatusIdx === i ? "bg-primary ring-4 ring-primary/20" : "bg-muted"}`}>
                  {currentStatusIdx > i ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className={`text-xs font-bold ${currentStatusIdx === i ? "text-white" : "text-muted-foreground"}`}>{i + 1}</span>}
                </div>
                <span className={`text-[9px] text-center leading-tight hidden sm:block ${currentStatusIdx === i ? "font-bold text-primary" : "text-muted-foreground"}`}>{STATUS_LABELS[s]}</span>
              </div>
              {i < TRACKING_STATUSES.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${currentStatusIdx > i ? "bg-primary" : "bg-muted"}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            🛠️ {isInProgress ? "Repair Tasks" : "Inspection Tasks"}
            <Badge variant="secondary" className="text-xs">{tasks.filter((t) => t.status === "DONE").length}/{tasks.length} done</Badge>
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
                onUpdate={(updates) => inspectionApi.updateTask(task.id, updates).then(loadTasks)}
                onDelete={async (id) => { await inspectionApi.deleteTask(id); loadTasks(); }}
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
        <>
          {(servicePrice > 0 || partsItems.length > 0 || laborItems.length > 0 || discounts.length > 0) && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" /> Initial Costing
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setInitialLaborModalOpen(true)}>
                    <PlusCircle className="w-3 h-3 mr-1" /> Add Labor
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setInitialPartModalOpen(true)}>
                    <PlusCircle className="w-3 h-3 mr-1" /> Add Part
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setInitialDiscountModalOpen(true)}>
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
                  <tr className="border-b border-border/50">
                    <td className="py-2 font-medium">{appointment.serviceType.name}</td>
                    <td className="text-right">1</td>
                    <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">₱{servicePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>

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

                  {computedLaborItems.length > 0 && (
                    <>
                      <tr className="bg-muted/20">
                        <td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Labor Charges</td>
                      </tr>
                      {computedLaborItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/50">
                          <td className="py-2 flex justify-between">
                            {item.label || 'Labor'}
                            <button onClick={() => estimateApi.removeLabor(item.id).then(loadAdjustments)} className="text-red-500 ml-2"><Trash2 className="w-3 h-3" /></button>
                          </td>
                          <td className="text-right">1</td>
                          <td className="text-right">₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="text-right">₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {computedDiscounts.length > 0 && (
                    <>
                      <tr className="bg-muted/20">
                        <td colSpan="4" className="py-1 text-xs font-semibold text-muted-foreground">Discounts</td>
                      </tr>
                      {computedDiscounts.map((disc) => (
                        <tr key={disc.id} className="border-b border-border/50">
                          <td className="py-2 flex justify-between">
                            {disc.type === "percentage" ? `${disc.value}% discount` : `Fixed discount (₱${disc.value})`}
                            <button onClick={() => estimateApi.removeDiscount(disc.id).then(loadAdjustments)} className="text-red-500 ml-2"><Trash2 className="w-3 h-3" /></button>
                          </td>
                          <td className="text-right">1</td>
                          <td className="text-right">-₱{disc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="text-right">-₱{disc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  <tr className="font-bold border-t border-border">
                    <td colSpan="3" className="text-right py-2">Total</td>
                    <td className="text-right">₱{initialGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
          )}
        </>
      ) : (
        // IN_PROGRESS: Additional Costs + Add Finding (attached to task)
        <div className="space-y-3">
          {/* Additional Costs Table */}
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
                  <th className="text-right py-2">Status</th>
                  <th className="text-right py-2"></th>
                </tr>
              </thead>
              <tbody>
                {additionalCosts.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-4 text-muted-foreground">No additional costs yet</td></tr>
                )}
                {additionalCosts.map((cost) => (
                  <tr key={cost.id} className="border-b border-border/50">
                    <td className="py-2">{cost.description || cost.type}</td>
                    <td className="text-right">₱{Number(cost.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">
                      {cost.status === 'PENDING' && <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>}
                      {cost.status === 'APPROVED' && <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>}
                      {cost.status === 'DECLINED' && <Badge variant="outline" className="text-red-600 border-red-300">Declined</Badge>}
                      {!cost.status && <Badge>Approved</Badge>}
                    </td>
                    <td className="text-right">
                      <button onClick={() => removeAdditionalCost(cost.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-border">
                  <td className="text-right py-2">Additional Total</td>
                  <td className="text-right">₱{additionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="text-right text-sm font-semibold">
              Original Estimate: ₱{initialGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}<br />
              Total with extras: ₱{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Add Finding Button */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> New Findings During Repair
              </h3>
              <Button size="sm" variant="outline" onClick={openFindingFlow} className="bg-primary/10 text-primary border-primary/30">
                <Plus className="w-3 h-3 mr-1" /> Add Finding
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Attach a finding to the currently active task. It will appear inside that task card.
            </div>
          </div>
        </div>
      )}

      {/* Modals for Under Inspection Costing */}
      <Dialog open={initialLaborModalOpen} onOpenChange={setInitialLaborModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Labor Charge (Initial)</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Amount (₱)</Label>
            <Input type="number" step="0.01" value={newAdditionalAmount} onChange={e => setNewAdditionalAmount(e.target.value)} />
            <Label>Description (optional)</Label>
            <Input value={newAdditionalDesc} onChange={e => setNewAdditionalDesc(e.target.value)} placeholder="e.g., Labor for brake repair" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitialLaborModalOpen(false)}>Cancel</Button>
            <Button onClick={addInitialLabor} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={initialPartModalOpen} onOpenChange={setInitialPartModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Part Cost (Initial)</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Amount (₱)</Label>
            <Input type="number" step="0.01" value={newAdditionalAmount} onChange={e => setNewAdditionalAmount(e.target.value)} />
            <Label>Description (optional)</Label>
            <Input value={newAdditionalDesc} onChange={e => setNewAdditionalDesc(e.target.value)} placeholder="e.g., Replacement brake pads" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitialPartModalOpen(false)}>Cancel</Button>
            <Button onClick={addInitialPart} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={initialDiscountModalOpen} onOpenChange={setInitialDiscountModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Discount (Initial)</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setInitialDiscountModalOpen(false)}>Cancel</Button>
            <Button onClick={addInitialDiscount} className="bg-primary">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Selector Modal */}
      <TaskSelectorModal
        open={taskSelectorOpen}
        onOpenChange={setTaskSelectorOpen}
        tasks={tasks}
        onSelectTask={handleTaskSelect}
        title="Choose a Task for This Finding"
      />

      {/* Finding Modal (description & products) */}
      <Dialog open={findingModalOpen} onOpenChange={setFindingModalOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Add New Finding</DialogTitle>
            {selectedTaskId && <p className="text-xs text-muted-foreground">Task ID: {selectedTaskId}</p>}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Finding Description *</Label>
              <Textarea
                value={findingDescription}
                onChange={e => setFindingDescription(e.target.value)}
                placeholder="e.g., Found leaking transmission fluid"
                rows={3}
              />
            </div>
            <div>
              <Label>Add parts / supplies</Label>
              <ProductPicker
                taskId={selectedTaskId || 'pending'}
                taskTitle={findingDescription || "New finding"}
                appointmentId={appointment.id}
                usedProducts={findingProducts}
                onDeduct={handleFindingProductDeduct}
              />
            </div>
            {findingProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {findingProducts.map(p => (
                  <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
                    {p.qty}× {p.name}
                    <button onClick={() => removeFindingProduct(p.id)} className="ml-1 text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindingModalOpen(false)}>Cancel</Button>
            <Button onClick={addFindingToTask} className="bg-primary">Add Finding</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddTaskModal open={addTaskModalOpen} onOpenChange={setAddTaskModalOpen} onAddTask={async (title) => {
        await inspectionApi.createTask(appointment.id, { title }); loadTasks();
      }} />

      <ConfirmationDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Send Approval Request"
        description={`Are you sure you want to send the initial estimate for ₱${initialGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} to the customer?`}
        onConfirm={confirmSendInitialCost}
        confirmText="Yes, Send"
      />

      {/* Additional Cost Modals (IN_PROGRESS) */}
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