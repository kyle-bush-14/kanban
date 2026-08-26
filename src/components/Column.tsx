import { useDroppable } from "@dnd-kit/react";
import type { ColumnId, Label, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { Button } from "./ui/controls";
import { cn } from "../lib/cn";

interface Props {
  id: ColumnId;
  title: string;
  tasks: Task[];
  labels: Label[];
  onOpenTask: (taskId: string) => void;
  onAddTask: (column: ColumnId) => void;
}

export function Column({ id, title, tasks, labels, onOpenTask, onAddTask }: Props) {
  // A column-level droppable so empty columns still accept a card. The id must
  // be the bare column id: @dnd-kit/helpers' `move` resolves a drop target by
  // looking it up as a key in the column map, so a prefixed id would never
  // match and dropping onto an empty column would silently do nothing.
  const { ref, isDropTarget } = useDroppable({ id, type: "column", accept: "task" });

  return (
    <section
      className={cn(
        "bg-surface border-line flex min-h-0 w-72 shrink-0 flex-col rounded-xl border transition-colors",
        isDropTarget && "border-accent-soft bg-surface-hover/40",
      )}
      aria-label={title}
    >
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-ink flex items-center gap-2 text-sm font-semibold">
          {title}
          <span className="bg-surface-hover text-ink-muted rounded-full px-1.5 py-0.5 text-[11px] font-medium">
            {tasks.length}
          </span>
        </h2>
        <Button
          onClick={() => onAddTask(id)}
          aria-label={`Add a task to ${title}`}
          title={`Add a task to ${title}`}
          className="px-1.5 py-1"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
          </svg>
        </Button>
      </header>

      <div ref={ref} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pt-1 pb-3">
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} labels={labels} column={id} index={index} onOpen={onOpenTask} />
        ))}

        {tasks.length === 0 && (
          <p className="border-line text-ink-faint rounded-lg border border-dashed px-3 py-6 text-center text-xs">
            Drop a card here
          </p>
        )}
      </div>
    </section>
  );
}
