import { createFileRoute } from "@tanstack/react-router";
import { StickyBoard } from "@/components/sticky/StickyBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sticky Board – Capture and organize your notes" },
      {
        name: "description",
        content:
          "A modern sticky notes board. Create, pin, color, search and reorder notes — synced to your account.",
      },
      { property: "og:title", content: "Sticky Board" },
      {
        property: "og:description",
        content: "Modern sticky notes board with search, sorting, drag & drop, and dark mode.",
      },
    ],
  }),
  component: StickyBoard,
});
