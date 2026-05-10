// SelectTaskModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SelectTaskModal({ open, onOpenChange, tasks, onSelect }) {
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const activeTasks = inProgressTasks.length ? inProgressTasks : tasks.filter(t => t.status !== 'DONE');
  
  if (activeTasks.length === 0) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Select a task for this finding</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {activeTasks.map(task => (
              <Button key={task.id} variant="outline" className="w-full justify-start" onClick={() => onSelect(task)}>
                {task.title}
              </Button>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}