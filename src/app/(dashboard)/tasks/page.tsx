"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/suite/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ListChecks, Plus, Trash2, CheckCircle2, Circle, Loader2, KanbanSquare,
  ArrowRight, ArrowLeft, CalendarDays, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  createdAt: string;
}

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};
const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};
const PRIORITY_ICON: Record<TaskPriority, React.ReactNode> = {
  low: <Circle className="w-3 h-3" />,
  medium: <Circle className="w-3 h-3" />,
  high: <Flame className="w-3 h-3" />,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "board">("list");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setTasks(await api<Task[]>("/api/tasks"));
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (status: TaskStatus = "todo") => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const task = await apiPost<Task>("/api/tasks", { title: newTitle.trim(), status, priority: newPriority });
      setTasks((prev) => [...prev, task]);
      setNewTitle("");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setAdding(false);
    }
  };

  const patch = async (id: string, data: Partial<Task>) => {
    try {
      const updated = await api<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      toast.error("Failed to update task");
    }
  };

  const toggleDone = (task: Task) => {
    patch(task.id, { status: task.status === "done" ? "todo" : "done" });
  };

  const move = (task: Task, dir: 1 | -1) => {
    const idx = STATUSES.indexOf(task.status);
    const next = STATUSES[idx + dir];
    if (next) patch(task.id, { status: next });
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const formatDue = (d: string | null) => {
    if (!d) return null;
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Tasks"
          description="Tasks, priorities, and a kanban board — all in one place"
          icon={<ListChecks className="w-4 h-4" />}
          actions={
            <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1">
              {(["list", "board"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                    view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                >
                  {v === "list" ? <ListChecks className="w-3 h-3" /> : <KanbanSquare className="w-3 h-3" />}
                  {v === "list" ? "List" : "Board"}
                </button>
              ))}
            </div>
          }
        />

        {/* Quick add */}
        <div className="flex gap-2 mb-5">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task and press Enter…"
            className="flex-1 h-10"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            className="h-10 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button onClick={() => addTask()} disabled={adding || !newTitle.trim()} className="gap-1.5">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="Add your first task above, or create one directly on the board." />
        ) : view === "list" ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card key={task.id} className={cn("group", task.status === "done" && "opacity-60")}>
                <CardContent className="p-3.5 flex items-center gap-3">
                  <button onClick={() => toggleDone(task)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors" aria-label="Toggle done">
                    {task.status === "done"
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      : <Circle className="w-5 h-5" />}
                  </button>
                  <span className={cn("flex-1 text-sm", task.status === "done" && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="w-3 h-3" /> {formatDue(task.dueDate)}
                    </span>
                  )}
                  <Badge className={cn("border", PRIORITY_STYLE[task.priority])}>
                    <span className="flex items-center gap-1">{PRIORITY_ICON[task.priority]}{task.priority}</span>
                  </Badge>
                  <button onClick={() => remove(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-destructive transition-all" aria-label="Delete task">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {STATUSES.map((status) => (
              <div key={status} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    {STATUS_LABEL[status]}
                    <Badge variant="secondary" className="text-[10px]">{byStatus(status).length}</Badge>
                  </span>
                </div>
                <div className="space-y-2">
                  {byStatus(status).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-lg border border-border/40 bg-card p-3 shadow-sm group",
                        task.status === "done" && "opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button onClick={() => toggleDone(task)} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary">
                          {task.status === "done" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <span className={cn("flex-1 text-sm", task.status === "done" && "line-through")}>{task.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge className={cn("border", PRIORITY_STYLE[task.priority])}><span className="flex items-center gap-1">{PRIORITY_ICON[task.priority]}{task.priority}</span></Badge>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="w-3 h-3" />{formatDue(task.dueDate)}</span>
                        )}
                        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status !== "todo" && (
                            <button onClick={() => move(task, -1)} className="p-1 rounded hover:bg-muted/60 text-muted-foreground" aria-label="Move left"><ArrowLeft className="w-3.5 h-3.5" /></button>
                          )}
                          {status !== "done" && (
                            <button onClick={() => move(task, 1)} className="p-1 rounded hover:bg-muted/60 text-muted-foreground" aria-label="Move right"><ArrowRight className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => remove(task.id)} className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {byStatus(status).length === 0 && (
                    <div className="text-center text-xs text-muted-foreground/60 py-6 border border-dashed border-border/40 rounded-lg">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
