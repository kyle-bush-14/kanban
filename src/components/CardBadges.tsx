import type { Label, Task } from "../types";
import { dueStatus, formatDueDate } from "../lib/date";
import { LABEL_CHIP } from "../lib/labelStyles";
import { cn } from "../lib/cn";

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
              <WeightIcon />
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
              <ClockIcon />
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
              <CheckIcon />
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function WeightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 13h10l-1.6-6.5H4.6L3 13Z" strokeLinejoin="round" />
      <circle cx="8" cy="4" r="1.6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 4.75V8l2.25 1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
