import type { Label, Task } from "../types";
import { dueStatus, formatDueDate } from "../lib/date";
import { LABEL_CHIP } from "../lib/labelStyles";
import { cn } from "../lib/cn";
import { Check, Clock, Weight } from "lucide-react";

const DUE_STYLES = {
  overdue: "bg-overdue/15 text-overdue",
  "due-soon": "bg-due-soon/15 text-due-soon",
  upcoming: "bg-surface-hover text-ink-muted",
} as const;

interface Props {
  task: Task;
  labels: Label[];
}

/** Each badge renders only when its field is actually filled in. */
export function CardBadges({ task, labels }: Props) {
  const taskLabels = labels.filter((label) => task.labelIds.includes(label.id));
  const checklistTotal = task.checklist.length;
  const checklistDone = task.checklist.filter((item) => item.done).length;
  const checklistComplete = checklistTotal > 0 && checklistDone === checklistTotal;

  const hasMeta = task.weight !== null || task.dueDate !== null || checklistTotal > 0;
  if (!hasMeta && taskLabels.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {taskLabels.map((label) => (
            <span
              key={label.id}
              className={cn(
                "rounded border px-1.5 py-0.5 text-[11px] leading-none font-medium",
                LABEL_CHIP[label.color],
              )}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {hasMeta && (
        <div className="text-ink-muted flex flex-wrap items-center gap-1.5 text-[11px]">
          {task.weight !== null && (
            <span
              className="bg-surface-hover text-ink-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium"
              title={`Weight: ${task.weight}`}
            >
              <Weight size={12} />
              {task.weight}
            </span>
          )}

          {task.dueDate !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium",
                DUE_STYLES[dueStatus(task.dueDate)],
              )}
              title={`Due ${task.dueDate}`}
            >
              <Clock size={12} />
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {checklistTotal > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium",
                checklistComplete ? "bg-label-green/15 text-label-green" : "bg-surface-hover text-ink-muted",
              )}
              title={`${checklistDone} of ${checklistTotal} sub-tasks complete`}
            >
              <Check size={12} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
