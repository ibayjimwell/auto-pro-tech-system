import React from 'react';
// UI Components from Shadcn/Radix
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icons
import { 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  Layers 
} from 'lucide-react';

export default function TaskSelectorModal({ open, onOpenChange, tasks, onSelectTask, title }) {
  // Logic: Filter only active tasks for finding association
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');

  // --- Empty State View ---
  if (inProgressTasks.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            {/* Visual Warning Indicator */}
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold tracking-tight">No Active Tasks Found</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                You need to start a repair operation before you can attach a finding. Please go back and mark a task as "Active".
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="w-full pt-2">
              <Button 
                className="w-full rounded-xl h-12 font-bold shadow-lg" 
                onClick={() => onOpenChange(false)}
              >
                Understood
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Active Selection View ---
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[85vh] rounded-2xl border-none shadow-2xl">
        
        {/* Header Section: Material-style with subtle primary background */}
        <DialogHeader className="p-6 bg-primary/5 border-b space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {title || 'Select Target Task'}
              </DialogTitle>
              <DialogDescription className="text-xs text-primary/70 font-medium uppercase tracking-wider">
                Select the operation for this finding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable List Section: Touch-friendly large hit targets */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="px-4 space-y-3">
            {inProgressTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-[0.98] group"
              >
                <div className="flex flex-col gap-1 pr-4">
                  <span className="font-bold text-sm sm:text-base text-foreground leading-tight group-hover:text-primary transition-colors">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Clock className="w-3 h-3 text-red-500 animate-pulse" />
                    <span>Currently In Progress</span>
                  </div>
                </div>

                <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-muted group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer: Simple close action for cancellation */}
        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button 
            variant="ghost" 
            className="w-full rounded-xl font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel Selection
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}