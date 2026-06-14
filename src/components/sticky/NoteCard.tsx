import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { colorClasses, type StickyNote } from "@/lib/sticky-notes";

interface NoteCardProps {
  note: StickyNote;
  onEdit: (note: StickyNote) => void;
  onDelete: (note: StickyNote) => void;
  onTogglePin: (note: StickyNote) => void;
  onDragStart?: (e: React.DragEvent, note: StickyNote) => void;
  onDragOver?: (e: React.DragEvent, note: StickyNote) => void;
  onDrop?: (e: React.DragEvent, note: StickyNote) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: NoteCardProps) {
  return (
    <article
      draggable
      onDragStart={(e) => onDragStart?.(e, note)}
      onDragOver={(e) => onDragOver?.(e, note)}
      onDrop={(e) => onDrop?.(e, note)}
      onDragEnd={onDragEnd}
      aria-label={`Note: ${note.title}`}
      className={cn(
        "sticky-card group relative flex h-full min-h-[180px] flex-col rounded-xl p-4",
        colorClasses(note.color),
        isDragging && "dragging",
        isDragOver && "drag-over",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 flex-1 text-base font-semibold leading-tight break-words">
          {note.title}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          onClick={() => onTogglePin(note)}
          className="-mr-2 -mt-2 h-8 w-8 shrink-0 hover:bg-black/10 dark:hover:bg-white/10"
        >
          {note.pinned ? (
            <Pin className="h-4 w-4 fill-current" />
          ) : (
            <PinOff className="h-4 w-4 opacity-60" />
          )}
        </Button>
      </div>

      <p className="mt-2 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed opacity-90">
        {note.content}
      </p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-[11px] opacity-60">
          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
        </span>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit note"
            onClick={() => onEdit(note)}
            className="h-8 w-8 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete note"
            onClick={() => onDelete(note)}
            className="h-8 w-8 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
