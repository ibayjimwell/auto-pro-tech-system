import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock } from 'lucide-react';

export default function TaskSelectorModal({ open, onOpenChange, tasks, onSelectTask, title }) {
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');

  if (inProgressTasks.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Active Task</DialogTitle>
            <DialogDescription>
              There are no tasks currently in progress. Please start a task first before adding a finding.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title || 'Select Task'}</DialogTitle>
          <DialogDescription>
            Which task does this finding relate to? Choose from the active tasks below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto py-2">
          {inProgressTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onSelectTask(task.id)}
            >
              <div>
                <p className="font-semibold">{task.title}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>In progress</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}