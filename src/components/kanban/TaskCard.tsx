import { Calendar, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIORITY_META, type Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onDragStart: (e: React.DragEvent, t: Task) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function formatDue(iso: string | null): { label: string; tone: string } | null {
  if (!iso) return null;
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const label = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (diff < 0) return { label: `Overdue · ${label}`, tone: "text-red-600 dark:text-red-400" };
  if (diff === 0) return { label: `Today · ${label}`, tone: "text-orange-600 dark:text-orange-400" };
  if (diff <= 3) return { label: `In ${diff}d · ${label}`, tone: "text-amber-600 dark:text-amber-400" };
  return { label, tone: "text-muted-foreground" };
}

export function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnd, isDragging }: Props) {
  const prio = PRIORITY_META[task.priority];
  const due = formatDue(task.due_date);

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md",
        task.status === "completed" && "opacity-80",
        isDragging && "opacity-40 scale-[0.98]",
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground/60 active:cursor-grabbing" />
        <h3
          className={cn(
            "flex-1 text-sm font-medium leading-snug",
            task.status === "completed" && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </h3>
      </div>

      {task.description && (
        <p className="mb-3 line-clamp-2 pl-6 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pl-6">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            prio.badge,
          )}
          title={prio.description}
        >
          {prio.label}
        </span>
        {due && (
          <span className={cn("inline-flex items-center gap-1 text-[11px]", due.tone)}>
            <Calendar className="h-3 w-3" />
            {due.label}
          </span>
        )}
        <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
