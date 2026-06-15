import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Moon, Plus, StickyNote as StickyIcon, Sun, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useTheme } from "@/hooks/use-auth";
import {
  createTask,
  deleteTask,
  fetchTasks,
  groupByStatus,
  PRIORITY_META,
  STATUS_META,
  TASK_PRIORITIES,
  TASK_STATUSES,
  updateTask,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "@/lib/tasks";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { cn } from "@/lib/utils";

export function TaskBoard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const tasksQuery = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => fetchTasks(user!.id),
    enabled: !!user,
  });

  const tasks = tasksQuery.data ?? [];
  const grouped = useMemo(() => groupByStatus(tasks), [tasks]);

  const createMut = useMutation({
    mutationFn: (input: TaskInput) => createTask(user!.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", user?.id] });
      toast.success("Task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TaskInput> & { position?: number } }) =>
      updateTask(id, patch),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", user?.id] }),
  });

  const handleSubmit = async (input: TaskInput) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, patch: input });
      toast.success("Task updated");
    } else {
      await createMut.mutateAsync(input);
    }
  };

  const openCreate = (status: TaskStatus) => {
    setEditing(null);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const handleDelete = async (t: Task) => {
    const userId = user!.id;
    qc.setQueryData<Task[]>(["tasks", userId], (old = []) => old.filter((o) => o.id !== t.id));
    try {
      await deleteTask(t.id);
      toast.success("Task deleted");
    } catch (e) {
      toast.error("Could not delete task");
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
    }
  };

  // Drag & drop across columns
  const onDragStart = (e: React.DragEvent, t: Task) => {
    setDragId(t.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => {
    setDragId(null);
    setDragOverCol(null);
  };
  const onColDragOver = (e: React.DragEvent, status: TaskStatus) => {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };
  const onColDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const userId = user!.id;
    const id = dragId;
    onDragEnd();
    if (!id) return;
    const source = tasks.find((t) => t.id === id);
    if (!source) return;

    const destItems = grouped[status].filter((t) => t.id !== id);
    const newPos = destItems.length;

    qc.setQueryData<Task[]>(["tasks", userId], (old = []) =>
      old.map((t) => (t.id === id ? { ...t, status, position: newPos } : t)),
    );

    if (source.status !== status) {
      toast.success(`Moved to ${STATUS_META[status].label}`);
    }

    try {
      await updateTask(id, { status, position: newPos });
    } catch {
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
    }
  };

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const totals = {
    todo: grouped.todo.length,
    ongoing: grouped.ongoing.length,
    completed: grouped.completed.length,
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sticky-yellow text-sticky-yellow-foreground shadow-sticky">
              <StickyIcon className="h-5 w-5" />
            </div>
            <span className="hidden text-lg font-semibold sm:inline">Sticky Board</span>
          </Link>

          <nav className="ml-4 flex items-center gap-1 rounded-lg bg-muted p-1 text-sm">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Notes
            </Link>
            <Link
              to="/tasks"
              className="rounded-md bg-background px-3 py-1.5 font-medium shadow-sm"
            >
              Tasks
            </Link>
          </nav>

          <div className="flex-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Priority guide">
                <Info className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <h4 className="mb-2 text-sm font-semibold">Priority levels</h4>
              <ul className="space-y-2">
                {TASK_PRIORITIES.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        PRIORITY_META[p].badge,
                      )}
                    >
                      {PRIORITY_META[p].label}
                    </span>
                    <span className="text-muted-foreground">{PRIORITY_META[p].description}</span>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Task Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag cards between columns to update status. {totals.todo + totals.ongoing + totals.completed} total ·{" "}
            {totals.ongoing} in progress · {totals.completed} done.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((status) => {
            const items = grouped[status];
            const meta = STATUS_META[status];
            const isOver = dragOverCol === status;
            return (
              <section
                key={status}
                onDragOver={(e) => onColDragOver(e, status)}
                onDragLeave={() => setDragOverCol((c) => (c === status ? null : c))}
                onDrop={(e) => onColDrop(e, status)}
                className={cn(
                  "flex flex-col rounded-xl bg-muted/40 p-3 transition-colors",
                  meta.tone,
                  isOver && "bg-primary/10 ring-2 ring-primary/40",
                )}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                    <h2 className="text-sm font-semibold">{meta.label}</h2>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label={`Add task to ${meta.label}`}
                    onClick={() => openCreate(status)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </header>

                <div className="flex min-h-[120px] flex-col gap-2">
                  {items.length === 0 ? (
                    <button
                      onClick={() => openCreate(status)}
                      className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      {isOver ? "Drop here" : "+ Add a task"}
                    </button>
                  ) : (
                    items.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onEdit={(task) => {
                          setEditing(task);
                          setFormOpen(true);
                        }}
                        onDelete={handleDelete}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        isDragging={dragId === t.id}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Button
        onClick={() => openCreate("todo")}
        aria-label="Create task"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full p-0 shadow-[var(--shadow-fab)]"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        defaultStatus={defaultStatus}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
