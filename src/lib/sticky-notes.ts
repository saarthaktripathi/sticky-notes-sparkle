import { supabase } from "@/integrations/supabase/client";

export const STICKY_COLORS = ["yellow", "blue", "green", "pink", "orange"] as const;
export type StickyColor = (typeof STICKY_COLORS)[number];

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: StickyColor;
  pinned: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type SortMode = "updated" | "created" | "title";

export interface NoteInput {
  title: string;
  content: string;
  color: StickyColor;
  pinned: boolean;
}

export async function fetchNotes(userId: string): Promise<StickyNote[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StickyNote[];
}

export async function createNote(userId: string, input: NoteInput) {
  const { data, error } = await supabase
    .from("notes")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as StickyNote;
}

export async function updateNote(id: string, patch: Partial<NoteInput> & { position?: number }) {
  const { data, error } = await supabase
    .from("notes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as StickyNote;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export function colorClasses(color: StickyColor) {
  switch (color) {
    case "blue":
      return "bg-sticky-blue text-sticky-blue-foreground";
    case "green":
      return "bg-sticky-green text-sticky-green-foreground";
    case "pink":
      return "bg-sticky-pink text-sticky-pink-foreground";
    case "orange":
      return "bg-sticky-orange text-sticky-orange-foreground";
    case "yellow":
    default:
      return "bg-sticky-yellow text-sticky-yellow-foreground";
  }
}

export function filterAndSort(notes: StickyNote[], query: string, sort: SortMode): StickyNote[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? notes.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
      )
    : notes;

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    switch (sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "created":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "updated":
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  return sorted;
}
