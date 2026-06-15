import { createFileRoute } from "@tanstack/react-router";
import { TaskBoard } from "@/components/kanban/TaskBoard";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Board – To Do, Ongoing, Completed" },
      {
        name: "description",
        content:
          "Drag-and-drop Kanban board to manage tasks across To Do, Ongoing, and Completed with priority levels.",
      },
      { property: "og:title", content: "Task Board" },
      {
        property: "og:description",
        content: "Organize tasks by status and priority with a fast Kanban board.",
      },
    ],
  }),
  component: TaskBoard,
});
