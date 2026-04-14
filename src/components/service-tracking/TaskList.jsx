import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import ProductPicker from './ProductPicker';

function SubtaskItem({ subtask, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 group">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={onToggle}
        className="flex-shrink-0"
      />
      <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
        {subtask.title}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function TaskItem({ task, onToggle, onToggleSubtask, onAddSubtask, onDeleteSubtask, onDelete, onAddProduct, appointmentId }) {
  const [expanded, setExpanded] = useState(true);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
    setAddingSubtask(false);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${task.completed ? 'border-border/50 bg-muted/20' : 'border-border bg-card'}`}>
      {/* Task Header */}
      <div className="flex items-center gap-2 p-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="flex-shrink-0"
        />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          }
          <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </span>
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {totalSubtasks > 0 && (
            <span className="text-[10px] text-muted-foreground">{completedSubtasks}/{totalSubtasks}</span>
          )}
          {task.requiresApproval && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-orange-300 text-orange-600">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Approval
            </Badge>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          <div className="ml-6 mt-2 space-y-0.5">
            {task.subtasks.map(s => (
              <SubtaskItem
                key={s.id}
                subtask={s}
                onToggle={() => onToggleSubtask(task.id, s.id)}
                onDelete={() => onDeleteSubtask(task.id, s.id)}
              />
            ))}
          </div>

          {/* Product Picker */}
          <ProductPicker
            taskId={task.id}
            taskTitle={task.title}
            appointmentId={appointmentId}
            usedProducts={task.addedProducts || []}
            onDeduct={(product) => onAddProduct(task.id, product)}
          />

          {addingSubtask ? (
            <div className="flex gap-2 mt-2 ml-6">
              <Input
                autoFocus
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSubtask();
                  if (e.key === 'Escape') setAddingSubtask(false);
                }}
                placeholder="Subtask description..."
                className="text-xs h-7"
              />
              <Button size="sm" onClick={handleAddSubtask} className="h-7 px-2 text-xs bg-primary hover:bg-primary/90">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingSubtask(false)} className="h-7 px-2 text-xs">Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setAddingSubtask(true)}
              className="ml-6 mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3 h-3" /> Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaskList({ session, onAddTask, onUpdateTask, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, onAddProduct, appointmentId }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const tasks = session.tasks || [];

  const completedCount = tasks.filter(t => t.completed).length;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({ title: newTaskTitle.trim(), subtasks: [] });
    setNewTaskTitle('');
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            Service Tasks
            <span className="text-xs font-normal text-muted-foreground">
              {completedCount}/{tasks.length} done
            </span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Task
          </Button>
        </div>
        {tasks.length > 0 && (
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.round((completedCount / tasks.length) * 100)}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            No tasks yet. Add tasks to track service progress.
          </p>
        )}

        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={(id) => onUpdateTask(id, { completed: !task.completed })}
            onToggleSubtask={onToggleSubtask}
            onAddSubtask={onAddSubtask}
            onDeleteSubtask={(taskId, subtaskId) => {
              const updated = task.subtasks.filter(s => s.id !== subtaskId);
              onUpdateTask(task.id, { subtasks: updated });
            }}
            onDelete={onDeleteTask}
            onAddProduct={onAddProduct}
            appointmentId={appointmentId}
          />
        ))}

        {adding && (
          <div className="flex gap-2 pt-1">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setAdding(false);
              }}
              placeholder="New task title..."
              className="text-sm h-9"
            />
            <Button onClick={handleAddTask} className="h-9 px-3 bg-primary hover:bg-primary/90 flex-shrink-0">Add</Button>
            <Button variant="ghost" onClick={() => setAdding(false)} className="h-9 px-3 flex-shrink-0">Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}