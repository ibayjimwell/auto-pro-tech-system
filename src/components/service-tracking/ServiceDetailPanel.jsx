import React, { useState, useEffect, useCallback } from "react";
// UI Components from Shadcn/Radix
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Shared & Custom Components
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TaskCard from "./TaskCard";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import AddTaskModal from "@/components/ui/AddTaskModal";
import TaskSelectorModal from "./TaskSelectorModal";
import ProductPicker from "./ProductPicker";

// Icons
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
  ChevronRight,
  Info,
} from "lucide-react";

// API & Context
import { appointmentsApi } from "@/api/appointmentsApi";
import { inspectionApi } from "@/api/inspectionApi";
import { invoicesApi } from "@/api/invoicesApi";
import { estimateApi } from "@/api/estimateApi";
import { additionalCostsApi } from "@/api/additionalCostsApi";
import { notify } from "@/lib/notify";
import { useAutoAuth } from "@/contexts/AuthContext";
import io from "socket.io-client";
import { BASE_URL } from "@/api/client";

const TRACKING_STATUSES = [
  "PENDING",
  "UNDER_INSPECTION",
  "WAITING_FOR_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
];

const STATUS_LABELS = {
  PENDING: "Pending",
  UNDER_INSPECTION: "Inspection",
  WAITING_FOR_APPROVAL: "Approval",
  IN_PROGRESS: "Repairing",
  COMPLETED: "Done",
};

export default function ServiceDetailPanel({
  appointment: initialAppointment,
  onBack,
  onStatusChanged,
}) {
  // --- State Management ---
  const [appointment, setAppointment] = useState(initialAppointment);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingCost, setSendingCost] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [laborItems, setLaborItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [additionalCosts, setAdditionalCosts] = useState([]);

  // Modal States
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [additionalPartModalOpen, setAdditionalPartModalOpen] = useState(false);
  const [initialLaborModalOpen, setInitialLaborModalOpen] = useState(false);
  const [initialPartModalOpen, setInitialPartModalOpen] = useState(false);
  const [initialDiscountModalOpen, setInitialDiscountModalOpen] =
    useState(false);
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);

  // Form States
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [findingDescription, setFindingDescription] = useState("");
  const [findingProducts, setFindingProducts] = useState([]);
  const [newAdditionalAmount, setNewAdditionalAmount] = useState("");
  const [newAdditionalDesc, setNewAdditionalDesc] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("fixed");
  const [newDiscountValue, setNewDiscountValue] = useState("");

  const { user } = useAutoAuth();
  const isInProgress = appointment.status === "IN_PROGRESS";

  // --- Data Fetching Logic ---
  useEffect(() => {
    setAppointment(initialAppointment);
  }, [initialAppointment]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await inspectionApi.getTasks(appointment.id);
      setTasks(res.data.data || []);
    } catch (error) {
      notify.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [appointment.id]);

  const loadAdjustments = useCallback(async () => {
    try {
      const res = await estimateApi.get(appointment.id);
      const adjustments = res.data?.data || [];
      const labors = adjustments.filter((a) => a.type === "labor");
      const disc = adjustments.filter((a) => a.type === "discount");
      setLaborItems(
        labors.map((l) => ({ id: l.id, amount: parseFloat(l.amount) })),
      );
      setDiscounts(
        disc.map((d) => ({
          id: d.id,
          type: d.discountType,
          value: parseFloat(d.discountValue),
        })),
      );
    } catch (err) {
      console.error("Failed to load adjustments", err);
    }
  }, [appointment.id]);

  const loadAdditionalCosts = useCallback(async () => {
    if (!isInProgress) return;
    try {
      const res = await additionalCostsApi.get(appointment.id);
      setAdditionalCosts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load additional costs", err);
    }
  }, [appointment.id, isInProgress]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);
  useEffect(() => {
    loadAdditionalCosts();
  }, [loadAdditionalCosts]);

  // --- Real-time Updates ---
  useEffect(() => {
    const socketUrl = BASE_URL.replace("/api/v1", "");
    const socket = io(socketUrl, { transports: ["websocket"] });

    socket.on(
      "taskChanged",
      (data) => data.appointmentId === appointment.id && loadTasks(),
    );
    socket.on("findingAdded", loadTasks);
    socket.on("findingDeleted", loadTasks);
    socket.on(
      "estimateUpdated",
      (data) => data.appointmentId === appointment.id && loadAdjustments(),
    );
    socket.on("appointmentChanged", (data) => {
      if (
        data.appointment?.id === appointment.id &&
        data.type === "statusChanged"
      ) {
        setAppointment((prev) => ({
          ...prev,
          status: data.appointment.status,
        }));
        if (onStatusChanged) onStatusChanged(data.appointment.status);
      }
    });
    socket.on(
      "additionalCostAdded",
      (data) => data.appointmentId === appointment.id && loadAdditionalCosts(),
    );

    return () => socket.disconnect();
  }, [
    appointment.id,
    loadTasks,
    loadAdjustments,
    loadAdditionalCosts,
    onStatusChanged,
  ]);

  // --- Cost Calculations ---
  const computeCosts = () => {
    const servicePrice = parseFloat(appointment.serviceType.basePrice) || 0;
    let partsTotal = 0;
    const partsItems = [];

    tasks.forEach((task) => {
      if (task.status === "DONE" && task.findings) {
        task.findings.forEach((finding) => {
          finding.products?.forEach((prod) => {
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
        });
      }
    });

    const laborTotal = laborItems.reduce((sum, item) => sum + item.amount, 0);
    const preDiscountTotal = servicePrice + partsTotal + laborTotal;
    let discountTotal = 0;
    const discountDetails = discounts.map((d) => {
      const amount =
        d.type === "percentage" ? preDiscountTotal * (d.value / 100) : d.value;
      discountTotal += amount;
      return { ...d, amount };
    });

    return {
      servicePrice,
      partsItems,
      partsTotal,
      laborItems,
      laborTotal,
      discounts: discountDetails,
      discountTotal,
      preDiscountTotal,
      grandTotal: preDiscountTotal - discountTotal,
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
    if (c.status === "DECLINED") return sum;
    return c.type === "discount"
      ? sum - Number(c.amount)
      : sum + Number(c.amount);
  }, 0);
  const totalCost = isInProgress
    ? initialGrandTotal + additionalTotal
    : initialGrandTotal;
  const hasAnyDoneTask = tasks.some((t) => t.status === "DONE");

  // --- Handlers ---
  const addInitialLabor = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) return notify.error("Enter valid amount");
    try {
      await estimateApi.addLabor(appointment.id, {
        amount,
        label: newAdditionalDesc || "Labor",
      });
      setNewAdditionalAmount("");
      setNewAdditionalDesc("");
      setInitialLaborModalOpen(false);
      loadAdjustments();
    } catch (err) {
      notify.error("Failed to add labor");
    }
  };

  const addInitialPart = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) return notify.error("Enter valid amount");
    try {
      await estimateApi.addLabor(appointment.id, {
        amount,
        label: newAdditionalDesc || "Part",
      });
      setNewAdditionalAmount("");
      setNewAdditionalDesc("");
      setInitialPartModalOpen(false);
      loadAdjustments();
    } catch (err) {
      notify.error("Failed to add part");
    }
  };

  const addInitialDiscount = async () => {
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) return notify.error("Enter valid value");
    try {
      await estimateApi.addDiscount(appointment.id, {
        discountType: newDiscountType,
        discountValue: value,
        label: newAdditionalDesc || "Discount",
      });
      setNewDiscountValue("");
      setNewAdditionalDesc("");
      setInitialDiscountModalOpen(false);
      loadAdjustments();
    } catch (err) {
      notify.error("Failed to add discount");
    }
  };

  const addAdditionalLabor = async () => {
    const amount = parseFloat(newAdditionalAmount);
    if (isNaN(amount) || amount <= 0) return notify.error("Enter valid amount");
    try {
      await additionalCostsApi.addLabor(appointment.id, {
        amount,
        description: newAdditionalDesc || "Labor",
      });
      setNewAdditionalAmount("");
      setNewAdditionalDesc("");
      setLaborModalOpen(false);
    } catch (err) {
      notify.error("Failed to add cost");
    }
  };

  const openFindingFlow = () => {
    const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
    if (activeTasks.length === 0)
      return notify.error("Please start a task first.");
    if (activeTasks.length === 1) {
      setSelectedTaskId(activeTasks[0].id);
      setFindingModalOpen(true);
    } else {
      setTaskSelectorOpen(true);
    }
  };

  const addFindingToTask = async () => {
    if (!findingDescription.trim()) return notify.error("Enter description");
    try {
      const partsPayload = findingProducts.map((p) => ({
        inventoryItemId: p.inventoryItemId,
        quantity: p.qty,
      }));
      await inspectionApi.addFinding(selectedTaskId, {
        description: findingDescription.trim(),
        products: partsPayload,
      });
      setFindingDescription("");
      setFindingProducts([]);
      setFindingModalOpen(false);
      loadTasks();
    } catch (err) {
      notify.error("Failed to add finding");
    }
  };

  const confirmSendInitialCost = async () => {
    setSendingCost(true);
    try {
      const details = `Estimate for ${appointment.serviceType.name}`;
      await invoicesApi.create({
        appointmentId: appointment.id,
        invoiceType: "ESTIMATE",
        status: "PENDING_APPROVAL",
        totalAmount: initialGrandTotal,
        details,
      });
      await appointmentsApi.updateStatus(
        appointment.id,
        "WAITING_FOR_APPROVAL",
        "Initial invoice sent",
      );
      onBack();
    } catch (err) {
      notify.error("Failed to send");
    } finally {
      setSendingCost(false);
      setSendConfirmOpen(false);
    }
  };

  const currentStatusIdx = TRACKING_STATUSES.indexOf(appointment.status);
  const showSendButton =
    appointment.status === "UNDER_INSPECTION" &&
    (hasAnyDoneTask || servicePrice > 0 || laborItems.length > 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header & Quick Info Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="rounded-full h-10 w-10 shrink-0 shadow-sm border-primary/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {appointment.customer.fullName}
              </h2>
              <StatusBadge
                status={appointment.status || "PENDING"}
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              />
            </div>
            <div className="flex items-center gap-x-4 gap-y-1 mt-2 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                <Car className="w-4 h-4 text-primary" />{" "}
                {appointment.vehicle.plateNumber}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                <Wrench className="w-4 h-4 text-primary" />{" "}
                {appointment.serviceType.name}
              </span>
              {appointment.appointmentDate && (
                <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                  <Clock className="w-4 h-4 text-primary" />{" "}
                  {appointment.appointmentDate} • {appointment.appointmentTime}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stepper */}
      <div className="bg-card border shadow-sm rounded-2xl p-6 overflow-hidden">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">
          Service Journey
        </p>
        <div className="relative flex items-center justify-between">
          {TRACKING_STATUSES.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-3 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                    currentStatusIdx > i
                      ? "bg-primary text-white"
                      : currentStatusIdx === i
                        ? "bg-primary text-white ring-8 ring-primary/10 scale-110"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStatusIdx > i ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase text-center max-w-[80px] hidden sm:block ${currentStatusIdx === i ? "text-primary" : "text-muted-foreground"}`}
                >
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < TRACKING_STATUSES.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-[-10px] transition-colors duration-500 ${currentStatusIdx > i ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area - Tasks */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">
                    {isInProgress
                      ? "Repair Operations"
                      : "Inspection Checklist"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tasks.filter((t) => t.status === "DONE").length} of{" "}
                    {tasks.length} tasks completed
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setAddTaskModalOpen(true)}
                className="rounded-full shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-muted/20 rounded-xl border border-dashed">
                <div className="p-3 bg-background rounded-full shadow-sm">
                  <Info className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  No operational tasks defined yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={(updates) =>
                      inspectionApi.updateTask(task.id, updates).then(loadTasks)
                    }
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

          {/* New Findings during Repair Section */}
          {isInProgress && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between shadow-sm">
              <div className="flex gap-4 items-center">
                <div className="bg-primary p-3 rounded-xl">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-primary">Add Findings</h4>
                  <p className="text-xs text-primary/70">
                    Found something new? Attach it to a task.
                  </p>
                </div>
              </div>
              <Button
                onClick={openFindingFlow}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Finding
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar - Costing */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border shadow-md rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Billing Summary</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    !isInProgress
                      ? setInitialLaborModalOpen(true)
                      : setLaborModalOpen(true)
                  }
                  title="Add Labor"
                >
                  <PlusCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    !isInProgress
                      ? setInitialPartModalOpen(true)
                      : setAdditionalPartModalOpen(true)
                  }
                  title="Add Part"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    !isInProgress
                      ? setInitialDiscountModalOpen(true)
                      : setDiscountModalOpen(true)
                  }
                  title="Add Discount"
                >
                  <Percent className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[500px]">
              <div className="p-5 space-y-4">
                {/* Fixed Service Fee */}
                <div className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-semibold">
                      {appointment.serviceType.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Standard Base Service
                    </p>
                  </div>
                  <span className="font-mono font-medium">
                    ₱
                    {servicePrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <Separator />

                {/* Dynamic Parts List */}
                {partsItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Parts & Materials
                    </p>
                    {partsItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm animate-in slide-in-from-left-2 duration-300"
                      >
                        <p className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </p>
                        <span className="font-mono">
                          ₱
                          {item.subtotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Labor & Extra Costs */}
                {(computedLaborItems.length > 0 ||
                  additionalCosts.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Adjustments & Labor
                    </p>
                    {[...computedLaborItems, ...additionalCosts].map(
                      (item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex justify-between items-center group text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {item.label || item.description || item.type}
                            </span>
                            {item.status && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1"
                              >
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              ₱
                              {Number(item.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <button
                              onClick={() =>
                                !isInProgress
                                  ? estimateApi
                                      .removeLabor(item.id)
                                      .then(loadAdjustments)
                                  : removeAdditionalCost(item.id)
                              }
                              className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Discounts */}
                {computedDiscounts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                      Active Discounts
                    </p>
                    {computedDiscounts.map((disc) => (
                      <div
                        key={disc.id}
                        className="flex justify-between items-center group text-sm"
                      >
                        <span className="text-green-600 italic font-medium">
                          {disc.type === "percentage"
                            ? `${disc.value}% off`
                            : "Discount"}
                        </span>
                        <div className="flex items-center gap-2 text-green-600">
                          <span className="font-mono">
                            -₱
                            {disc.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <button
                            onClick={() =>
                              estimateApi
                                .removeDiscount(disc.id)
                                .then(loadAdjustments)
                            }
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-5 bg-primary/5 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="text-2xl font-black text-primary font-mono tracking-tighter">
                  ₱
                  {totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {showSendButton && (
                <Button
                  onClick={handleSendInitialCost}
                  disabled={sendingCost}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 shadow-lg shadow-primary/20"
                >
                  {sendingCost ? "Processing..." : "Submit Quote to Customer"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Unified Modals Section --- */}
      {/* Scrollable Modals for complex interactions */}

      {/* Finding Dialog */}
      <Dialog open={findingModalOpen} onOpenChange={setFindingModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> New Diagnostic Finding
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">

              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Required Parts & Supplies
                </Label>
                <div className="p-4 border rounded-2xl bg-muted/20">
                  <ProductPicker
                    taskId={selectedTaskId || "pending"}
                    taskTitle={findingDescription || "New finding"}
                    appointmentId={appointment.id}
                    usedProducts={findingProducts}
                    onDeduct={(prod) =>
                      setFindingProducts((p) => [
                        ...p,
                        { ...prod, id: Date.now() },
                      ])
                    }
                  />
                </div>

                {findingProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {findingProducts.map((p) => (
                      <Badge
                        key={p.id}
                        variant="secondary"
                        className="pl-3 pr-1 py-1 rounded-full border-primary/10 flex items-center gap-2"
                      >
                        <span className="font-bold text-primary">{p.qty}×</span>{" "}
                        {p.name}
                        <button
                          onClick={() =>
                            setFindingProducts((prev) =>
                              prev.filter((item) => item.id !== p.id),
                            )
                          }
                          className="bg-background rounded-full p-0.5 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Finding Details
                </Label>
                <Textarea
                  value={findingDescription}
                  onChange={(e) => setFindingDescription(e.target.value)}
                  placeholder="Describe what you discovered during the inspection..."
                  className="min-h-[120px] rounded-xl focus-visible:ring-primary/30"
                />
              </div>

              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-muted/10">
            <Button
              variant="outline"
              onClick={() => setFindingModalOpen(false)}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={addFindingToTask}
              className="rounded-xl px-8 shadow-md"
            >
              Add Finding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Input Modals (Labor/Part/Discount) */}
      {/* These handle both initial and in-progress states */}
      <Dialog
        open={initialLaborModalOpen || laborModalOpen}
        onOpenChange={(val) => {
          setInitialLaborModalOpen(val);
          setLaborModalOpen(val);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden p-0">
          <DialogHeader className="p-6 bg-primary/5">
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" /> Add Labor Charge
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Amount (₱)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-muted-foreground">
                  ₱
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-8 rounded-xl h-11"
                  value={newAdditionalAmount}
                  onChange={(e) => setNewAdditionalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Description
              </Label>
              <Input
                className="rounded-xl h-11"
                value={newAdditionalDesc}
                onChange={(e) => setNewAdditionalDesc(e.target.value)}
                placeholder="e.g., Extended engine work"
              />
            </div>
          </div>
          <DialogFooter className="p-6 border-t flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setInitialLaborModalOpen(false);
                setLaborModalOpen(false);
              }}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={!isInProgress ? addInitialLabor : addAdditionalLabor}
              className="flex-1 rounded-xl"
            >
              Add to Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Selector */}
      <TaskSelectorModal
        open={taskSelectorOpen}
        onOpenChange={setTaskSelectorOpen}
        tasks={tasks}
        onSelectTask={(id) => {
          setSelectedTaskId(id);
          setTaskSelectorOpen(false);
          setFindingModalOpen(true);
        }}
        title="Associate Finding with Task"
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={addTaskModalOpen}
        onOpenChange={setAddTaskModalOpen}
        onAddTask={async (title) => {
          await inspectionApi.createTask(appointment.id, { title });
          loadTasks();
        }}
      />

      {/* Initial Estimate Confirmation */}
      <ConfirmationDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Approve & Send Quote"
        description={`Confirm sending the initial estimate of ₱${initialGrandTotal.toLocaleString()} to the customer for approval?`}
        onConfirm={confirmSendInitialCost}
        confirmText="Confirm & Send"
      />
    </div>
  );
}
