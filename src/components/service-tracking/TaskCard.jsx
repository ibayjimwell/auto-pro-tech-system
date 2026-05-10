import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, PlayCircle, Trash2 } from "lucide-react";
import FindingsModal from "./FindingsModal";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

const TaskCard = ({ task, onUpdate, onDelete, appointmentId, isInProgress = false }) => {
  const [isDoing, setIsDoing] = useState(false);
  const [findingsModal, setFindingsModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [markDoneConfirmOpen, setMarkDoneConfirmOpen] = useState(false);

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
      // In IN_PROGRESS, just confirm and mark done (no findings modal)
      setMarkDoneConfirmOpen(true);
    } else {
      // In UNDER_INSPECTION, show findings modal first
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

  return (
    <>
      <Card className={`border-l-4 ${isActive ? "border-red-500" : isDone ? "border-green-500" : "border-gray-300"} transition-all`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {isActive && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
              {isDone && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {task.title}
            </CardTitle>
            <div className="flex gap-1">
              {!isDone && (
                <>
                  {task.status === "PENDING" && (
                    <Button size="sm" variant="outline" onClick={handleDoClick} disabled={isDoing} className="h-7 text-xs">
                      <PlayCircle className="w-3 h-3 mr-1" /> Do
                    </Button>
                  )}
                  {task.status === "IN_PROGRESS" && (
                    <Button size="sm" variant="default" onClick={handleMarkDone} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Mark as Done
                    </Button>
                  )}
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setDeleteDialogOpen(true)} className="h-7 text-xs text-red-500">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {task.findings?.length > 0 && (
            <div className="bg-muted/30 p-2 rounded text-xs space-y-2">
              {task.findings.map((f, idx) => (
                <div key={idx}>
                  <p className="font-semibold">Finding:</p>
                  <p>• {f.description}</p>
                  {f.products && f.products.length > 0 && (
                    <div className="mt-1 ml-2">
                      <span className="font-semibold">Parts/Supplies used:</span>
                      <ul className="list-disc ml-4">
                        {f.products.map((p, i) => (
                          <li key={i}>
                            {p.quantity}x {p.name} (₱{Number(p.priceAtTime).toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Always show FindingsModal when marking DONE - both inspection and repair tasks need findings */}
      <FindingsModal
        open={findingsModal}
        onClose={() => setFindingsModal(false)}
        onSubmit={handleFindingsSubmit}
        taskTitle={task.title}
        taskId={task.id}
        appointmentId={appointmentId}
      />

      <ConfirmationDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        title="Start Task"
        description={`Are you sure you want to start working on "${task.title}"?`}
        onConfirm={confirmStart}
        confirmText="Yes, Start"
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task"
        description={`Delete task "${task.title}"? This action cannot be undone.`}
        onConfirm={() => onDelete(task.id)}
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmationDialog
        open={markDoneConfirmOpen}
        onOpenChange={setMarkDoneConfirmOpen}
        title="Mark Task as Done"
        description={`Mark "${task.title}" as completed?`}
        onConfirm={confirmMarkDone}
        confirmText="Yes, Mark Done"
      />
    </>
  );
};

export default TaskCard;