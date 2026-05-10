import React, { useState } from "react";
// UI Components from Shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { 
  CheckCircle2, 
  Settings, 
  PlayCircle, 
  Trash2, 
  AlertCircle, 
  Package, 
  FileText,
  ChevronRight
} from "lucide-react";

// Shared Components
import FindingsModal from "./FindingsModal";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

const TaskCard = ({ task, onUpdate, onDelete, appointmentId, isInProgress = false }) => {
  // --- State Management ---
  const [isDoing, setIsDoing] = useState(false);
  const [findingsModal, setFindingsModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [markDoneConfirmOpen, setMarkDoneConfirmOpen] = useState(false);

  // --- Handlers ---
  const handleDoClick = () => {
    if (task.status === "PENDING") {
      setStartDialogOpen(true);
    }
  };

  const confirmStart = () => {
    setIsDoing(true);
    onUpdate({ status: "IN_PROGRESS" });
    setIsDoing(false);
    setStartDialogOpen(false);
  };

  const handleMarkDone = () => {
    if (isInProgress) {
      setMarkDoneConfirmOpen(true);
    } else {
      setFindingsModal(true);
    }
  };

  const confirmMarkDone = async () => {
    await onUpdate({ status: "DONE" });
    setMarkDoneConfirmOpen(false);
  };

  const handleFindingsSubmit = async () => {
    await onUpdate({ status: "DONE" });
    setFindingsModal(false);
  };

  const isActive = task.status === "IN_PROGRESS";
  const isDone = task.status === "DONE";

  // Dynamic Styles based on status
  const statusConfig = {
    PENDING: { border: "border-l-muted-foreground/30", bg: "bg-card", icon: null, label: "To Do" },
    IN_PROGRESS: { border: "border-l-red-500", bg: "bg-red-50/30 dark:bg-red-950/10", icon: <Settings className="w-4 h-4 animate-spin text-red-500" />, label: "Active" },
    DONE: { border: "border-l-green-500", bg: "bg-green-50/30 dark:bg-green-950/10", icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, label: "Completed" }
  };

  const currentStatus = statusConfig[task.status] || statusConfig.PENDING;

  return (
    <>
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md border border-border border-l-4 ${currentStatus.border} ${currentStatus.bg} rounded-xl`}>
        <CardContent className="p-4 sm:p-5">
          {/* Header Section: Title and Quick Actions */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center gap-2">
                {currentStatus.icon}
                <h4 className={`font-bold text-sm sm:text-base tracking-tight leading-tight ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {task.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-tighter h-5 px-1.5 ${isActive ? "text-red-500 border-red-200" : ""}`}>
                   {currentStatus.label}
                 </Badge>
                 {task.findings?.length > 0 && (
                   <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-none">
                     {task.findings.length} Finding{task.findings.length > 1 ? 's' : ''}
                   </Badge>
                 )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Contextual Action Buttons */}
              {!isDone && (
                <div className="flex gap-2">
                  {task.status === "PENDING" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleDoClick} 
                      disabled={isDoing} 
                      className="h-9 px-4 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm group"
                    >
                      {isDoing ? <Settings className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                      <span className="font-semibold text-xs uppercase tracking-wide">Start</span>
                    </Button>
                  )}
                  {task.status === "IN_PROGRESS" && (
                    <Button 
                      size="sm" 
                      onClick={handleMarkDone} 
                      className="h-9 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 dark:shadow-none transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span className="font-semibold text-xs uppercase tracking-wide">Finish</span>
                    </Button>
                  )}
                </div>
              )}
              
              {/* Delete Action - Subtle until hovered */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setDeleteDialogOpen(true)} 
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Findings Display Section */}
          {task.findings?.length > 0 && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Separator className="bg-border/50" />
              <div className="space-y-3">
                {task.findings.map((f, idx) => (
                  <div key={idx} className="bg-background/60 border rounded-lg p-3 space-y-2 shadow-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 mt-0.5 text-primary/70" />
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Finding Details</p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{f.description}</p>
                      </div>
                    </div>

                    {f.products && f.products.length > 0 && (
                      <div className="pl-5 pt-1 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Package className="w-3 h-3" />
                          Materials Used
                        </div>
                        <div className="grid gap-1">
                          {f.products.map((p, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-muted/30 px-2 py-1.5 rounded-md border border-transparent hover:border-primary/10 transition-colors">
                              <span className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">{p.quantity}x</span>
                                <span className="font-medium">{p.name}</span>
                              </span>
                              <span className="font-mono text-muted-foreground">₱{Number(p.priceAtTime).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Modals & Dialogs --- */}
      
      {/* Findings Modal with Scrollable Area */}
      <FindingsModal
        open={findingsModal}
        onClose={() => setFindingsModal(false)}
        onSubmit={handleFindingsSubmit}
        taskTitle={task.title}
        taskId={task.id}
        appointmentId={appointmentId}
      />

      {/* Start Task Confirmation */}
      <ConfirmationDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        title="Start Operation"
        description={`Begin working on "${task.title}"? This will update the status to Active.`}
        onConfirm={confirmStart}
        confirmText="Confirm Start"
      />

      {/* Delete Task Confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Task"
        description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        onConfirm={() => onDelete(task.id)}
        confirmText="Delete Task"
        variant="destructive"
      />

      {/* Completion Confirmation */}
      <ConfirmationDialog
        open={markDoneConfirmOpen}
        onOpenChange={setMarkDoneConfirmOpen}
        title="Complete Task"
        description={`Finalize and mark "${task.title}" as completed?`}
        onConfirm={confirmMarkDone}
        confirmText="Mark as Completed"
      />
    </>
  );
};

export default TaskCard;