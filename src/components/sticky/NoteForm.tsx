import { useEffect, useState } from "react";
import { Pin, PinOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  STICKY_COLORS,
  colorClasses,
  type NoteInput,
  type StickyColor,
  type StickyNote,
} from "@/lib/sticky-notes";

const TITLE_MAX = 100;
const CONTENT_MAX = 1000;

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StickyNote | null;
  onSubmit: (input: NoteInput) => Promise<void> | void;
}

export function NoteForm({ open, onOpenChange, initial, onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<StickyColor>("yellow");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setContent(initial?.content ?? "");
      setColor((initial?.color as StickyColor) ?? "yellow");
      setPinned(initial?.pinned ?? false);
      setTouched(false);
    }
  }, [open, initial]);

  const titleError = touched && title.trim().length === 0 ? "Title is required" : null;
  const contentError = touched && content.trim().length === 0 ? "Content is required" : null;
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim().slice(0, TITLE_MAX),
        content: content.trim().slice(0, CONTENT_MAX),
        color,
        pinned,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initial ? "Edit note" : "New note"}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="note-title">Title</Label>
                <span className="text-xs text-muted-foreground">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id="note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                placeholder="Give it a title"
                maxLength={TITLE_MAX}
                aria-invalid={!!titleError}
                autoFocus
              />
              {titleError && <p className="text-xs text-destructive">{titleError}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="note-content">Content</Label>
                <span className="text-xs text-muted-foreground">
                  {content.length}/{CONTENT_MAX}
                </span>
              </div>
              <Textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                placeholder="Write what's on your mind"
                rows={6}
                maxLength={CONTENT_MAX}
                aria-invalid={!!contentError}
              />
              {contentError && <p className="text-xs text-destructive">{contentError}</p>}
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Note color">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    aria-label={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                      colorClasses(c),
                      color === c ? "ring-foreground" : "ring-transparent",
                    )}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              aria-pressed={pinned}
            >
              {pinned ? (
                <>
                  <Pin className="h-4 w-4 fill-current" /> Pinned
                </>
              ) : (
                <>
                  <PinOff className="h-4 w-4" /> Pin to top
                </>
              )}
            </button>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {initial ? "Save changes" : "Create note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
