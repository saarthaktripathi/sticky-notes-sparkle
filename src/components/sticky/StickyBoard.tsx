import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Moon, Plus, StickyNote as StickyIcon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useTheme } from "@/hooks/use-auth";
import {
  createNote,
  deleteNote,
  fetchNotes,
  filterAndSort,
  updateNote,
  type NoteInput,
  type SortMode,
  type StickyNote,
} from "@/lib/sticky-notes";
import { NoteCard } from "@/components/sticky/NoteCard";
import { NoteForm } from "@/components/sticky/NoteForm";
import { SearchBar } from "@/components/sticky/SearchBar";
import { SortDropdown } from "@/components/sticky/SortDropdown";

export function StickyBoard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StickyNote | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StickyNote | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("updated");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const notesQuery = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: () => fetchNotes(user!.id),
    enabled: !!user,
  });

  const notes = notesQuery.data ?? [];
  const visible = useMemo(() => filterAndSort(notes, query, sort), [notes, query, sort]);

  const createMutation = useMutation({
    mutationFn: (input: NoteInput) => createNote(user!.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", user?.id] });
      toast.success("Note created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NoteInput> }) =>
      updateNote(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = async (input: NoteInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, patch: input });
      toast.success("Note updated");
    } else {
      await createMutation.mutateAsync(input);
    }
  };

  const handleEdit = (n: StickyNote) => {
    setEditing(n);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleTogglePin = (n: StickyNote) => {
    updateMutation.mutate({ id: n.id, patch: { pinned: !n.pinned } });
  };

  // Undo-delete: remove from cache for 10s, then hard-delete
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleDelete = (n: StickyNote) => {
    const userId = user!.id;
    qc.setQueryData<StickyNote[]>(["notes", userId], (old = []) =>
      old.filter((o) => o.id !== n.id),
    );

    const timer = setTimeout(async () => {
      undoTimers.current.delete(n.id);
      try {
        await deleteNote(n.id);
      } catch (e) {
        toast.error("Could not delete note");
        qc.invalidateQueries({ queryKey: ["notes", userId] });
      }
    }, 10_000);
    undoTimers.current.set(n.id, timer);

    toast("Note deleted", {
      description: n.title,
      duration: 10_000,
      action: {
        label: "Undo",
        onClick: () => {
          const t = undoTimers.current.get(n.id);
          if (t) clearTimeout(t);
          undoTimers.current.delete(n.id);
          qc.setQueryData<StickyNote[]>(["notes", userId], (old = []) =>
            old.some((o) => o.id === n.id) ? old : [n, ...old],
          );
          toast.success("Restored");
        },
      },
    });
  };

  useEffect(() => () => undoTimers.current.forEach((t) => clearTimeout(t)), []);

  // Drag and drop reordering (within same pinned group)
  const handleDragStart = (e: React.DragEvent, n: StickyNote) => {
    setDragId(n.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, n: StickyNote) => {
    if (!dragId || dragId === n.id) return;
    e.preventDefault();
    setDragOverId(n.id);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };
  const handleDrop = async (e: React.DragEvent, target: StickyNote) => {
    e.preventDefault();
    const userId = user!.id;
    if (!dragId || dragId === target.id) {
      handleDragEnd();
      return;
    }
    const source = notes.find((n) => n.id === dragId);
    if (!source || source.pinned !== target.pinned) {
      handleDragEnd();
      return;
    }

    // Reorder local cache optimistically
    const others = notes.filter((n) => n.id !== source.id);
    const targetIdx = others.findIndex((n) => n.id === target.id);
    const reordered = [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
    // Renumber positions inside the pinned group
    const sameGroup = reordered.filter((n) => n.pinned === source.pinned);
    const positions = new Map(sameGroup.map((n, i) => [n.id, i]));
    const updated = reordered.map((n) =>
      positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n,
    );
    qc.setQueryData<StickyNote[]>(["notes", userId], updated);
    handleDragEnd();

    // Persist only the moved note's new position (cheap)
    try {
      await updateNote(source.id, { position: positions.get(source.id)! });
    } catch {
      qc.invalidateQueries({ queryKey: ["notes", userId] });
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

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sticky-yellow text-sticky-yellow-foreground shadow-sticky">
              <StickyIcon className="h-5 w-5" />
            </div>
            <span className="hidden text-lg font-semibold sm:inline">Sticky Board</span>
          </div>

          <div className="ml-2 flex-1">
            <SearchBar value={query} onChange={setQuery} />
          </div>

          <div className="hidden sm:block">
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="shrink-0"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={handleSignOut}
            className="shrink-0"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="mx-auto block max-w-6xl px-4 pb-3 sm:hidden">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {notesQuery.isLoading ? (
          <SkeletonGrid />
        ) : visible.length === 0 ? (
          <EmptyState hasNotes={notes.length > 0} onCreate={handleCreate} />
        ) : (
          <section
            aria-label="Notes"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visible.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onEdit={handleEdit}
                onDelete={(note) => setPendingDelete(note)}
                onTogglePin={handleTogglePin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={dragId === n.id}
                isDragOver={dragOverId === n.id}
              />
            ))}
          </section>
        )}
      </main>

      <Button
        onClick={handleCreate}
        aria-label="Create note"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full p-0 shadow-[var(--shadow-fab)]"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <NoteForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll have 10 seconds to undo before it's gone for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ hasNotes, onCreate }: { hasNotes: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="absolute -left-6 top-2 h-20 w-20 rotate-[-8deg] rounded-xl bg-sticky-pink shadow-sticky" />
        <div className="absolute -right-6 top-2 h-20 w-20 rotate-[8deg] rounded-xl bg-sticky-blue shadow-sticky" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-xl bg-sticky-yellow text-sticky-yellow-foreground shadow-sticky">
          <StickyIcon className="h-10 w-10" />
        </div>
      </div>
      <h2 className="text-xl font-semibold">
        {hasNotes ? "No matching notes" : "Your board is empty"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasNotes
          ? "Try a different search term, or clear the search to see everything."
          : "Tap the + button to drop your first sticky note onto the board."}
      </p>
      {!hasNotes && (
        <Button onClick={onCreate} className="mt-6">
          <Plus className="mr-1 h-4 w-4" /> Create your first note
        </Button>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
