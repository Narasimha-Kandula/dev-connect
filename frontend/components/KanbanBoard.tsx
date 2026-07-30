'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Plus, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  dueDate: string | null;
}

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'border-t-slate-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-400' },
  { key: 'REVIEW', label: 'Review', color: 'border-t-amber-400' },
  { key: 'DONE', label: 'Done', color: 'border-t-green-400' },
];

function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground cursor-grab">
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          {task.dueDate && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
  onAdd,
}: {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onAdd: (status: string) => void;
}) {
  const ids = tasks.map((t) => t.id);

  return (
    <div className={`flex min-h-[200px] w-72 shrink-0 flex-col rounded-xl border bg-muted/30 border-t-2 ${column.color}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{column.label}</span>
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAdd(column.key)} className="text-muted-foreground hover:text-foreground">
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[400px]">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const token = useAuthStore((s) => s.token);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.get<any>(`/projects/${projectId}`, token ?? undefined);
      setTasks(data.tasks ?? []);
    } catch {
      toast.error('Failed to load tasks');
    }
  }, [projectId, token]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    const overTask = tasks.find((t) => t.id === over.id);
    const newStatus = overTask ? overTask.status : active.id.toString();

    if (task.status !== newStatus) {
      try {
        await api.patch(`/projects/tasks/${task.id}`, { status: newStatus }, token ?? undefined);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
        toast.success('Task updated');
      } catch {
        toast.error('Failed to update task');
      }
    }
  }

  async function handleAdd() {
    if (!showAdd || !newTitle.trim()) return;
    try {
      await api.post(`/projects/${projectId}/tasks`, { title: newTitle, status: showAdd }, token ?? undefined);
      setNewTitle('');
      setShowAdd(null);
      await loadTasks();
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <DndContext onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex gap-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              column={col}
              tasks={tasks.filter((t) => t.status === col.key)}
              onAdd={(s) => setShowAdd(s)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? <div className="rounded-lg border bg-card p-3 shadow-lg opacity-90"><p className="text-sm">{tasks.find((t) => t.id === activeId)?.title}</p></div> : null}
        </DragOverlay>
      </DndContext>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(null)}>
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">Add Task to {COLUMNS.find((c) => c.key === showAdd)?.label}</p>
              <button onClick={() => setShowAdd(null)}><X size={18} /></button>
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Task title…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAdd(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleAdd} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
