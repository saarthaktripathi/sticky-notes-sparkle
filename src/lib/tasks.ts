import { supabase } from "@/integrations/supabase/client";

export const TASK_STATUSES = ["todo", "ongoing", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; tone: string; dot: string }
> = {
  todo: {
    label: "To Do",
    tone: "border-l-4 border-l-slate-400",
    dot: "bg-slate-400",
  },
  ongoing: {
    label: "Ongoing",
    tone: "border-l-4 border-l-amber-500",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    tone: "border-l-4 border-l-emerald-500",
    dot: "bg-emerald-500",
  },
};

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; badge: string; weight: number; description: string }
> = {
  low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    weight: 1,
    description: "Nice-to-have. No deadline pressure.",
  },
  medium: {
    label: "Medium",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    weight: 2,
    description: "Standard work. Schedule it this week.",
  },
  high: {
    label: "High",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
    weight: 3,
    description: "Important. Tackle before lower-priority items.",
  },
  urgent: {
    label: "Urgent",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
    weight: 4,
    description: "Critical. Do this first — blocks other work.",
  },
};

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(userId: string, input: TaskInput) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput> & { position?: number; status?: TaskStatus },
) {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = { todo: [], ongoing: [], completed: [] };
  for (const t of tasks) grouped[t.status].push(t);
  for (const s of TASK_STATUSES) {
    grouped[s].sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
    });
  }
  return grouped;
}
