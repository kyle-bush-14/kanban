import { useRef } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import type { ColumnId, Label, Task } from "../types";
import { DONE_COLUMN } from "../types";
import { CardBadges } from "./CardBadges";
import { cn } from "../lib/cn";

/** Pure visual card — shared by the sortable card and the drag overlay. */
export function TaskCardContent({ task, labels, done }: { task: Task; labels: Label[]; done: boolean }) {
  return (
    <>
      <p
        className={cn(
          "text-ink text-sm leading-snug font-medium break-words",
          done && "decoration-ink-faint line-through decoration-2",
        )}
      >
        {task.name}
      </p>
      <CardBadges task={task} labels={labels} />
    </>
  );
}

interface Props {
  task: Task;
  labels: Label[];
  column: ColumnId;
  index: number;
  onOpen: (taskId: string) => void;
}

export function TaskCard({ task, labels, column, index, onOpen }: Props) {
  const { ref, isDragging } = useSortable({ id: task.id, index, group: column, type: "task", accept: "task" });

  // Distinguish a click from a drag: only open the dialog when the pointer
  // barely moved between press and release.
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  const done = column === DONE_COLUMN;

  return (
    <article
      ref={ref}
      data-task-id={task.id}
      role="button"
      tabIndex={0}
      aria-label={`Open task: ${task.name}`}
      onPointerDown={(event) => {
        pressOrigin.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const origin = pressOrigin.current;
        pressOrigin.current = null;
        if (!origin || isDragging) return;
        const moved = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
        if (moved < 5) onOpen(task.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen(task.id);
        }
      }}
      className={cn(
        "bg-surface-raised border-line hover:border-line-strong rounded-card cursor-grab border p-3",
        "focus-visible:ring-accent/70 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isDragging && "opacity-40",
        done && "opacity-75",
      )}
    >
      <TaskCardContent task={task} labels={labels} done={done} />
    </article>
  );
}
