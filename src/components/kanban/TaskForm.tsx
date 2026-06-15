import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITY_META,
  STATUS_META,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
} from "@/lib/tasks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Task | null;
  defaultStatus?: TaskInput["status"];
  onSubmit: (input: TaskInput) => Promise<void> | void;
}

const empty: TaskInput = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: null,
};

export function TaskForm({ open, onOpenChange, initial, defaultStatus, onSubmit }: Props) {
  const [form, setForm] = useState<TaskInput>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        status: initial.status,
        priority: initial.priority,
        due_date: initial.due_date,
      });
    } else {
      setForm({ ...empty, status: defaultStatus ?? "todo" });
    }
  }, [open, initial, defaultStatus]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, title: form.title.trim() });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Track what needs doing, what's in progress, and what's done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={1000}
              rows={3}
              placeholder="Add context, links, or sub-steps…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as TaskInput["status"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as TaskInput["priority"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {PRIORITY_META[form.priority].description}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date (optional)</Label>
            <Input
              id="task-due"
              type="date"
              value={form.due_date ? form.due_date.slice(0, 10) : ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  due_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {initial ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
