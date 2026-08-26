import { Dialog } from "@base-ui/react/dialog";
import { NumberField } from "@base-ui/react/number-field";
import type { BoardAction } from "../state/boardReducer";
import type { ColumnId, Label, LabelColor, Task } from "../types";
import { COLUMNS } from "../types";
import { ChecklistEditor } from "./ChecklistEditor";
import { LabelPicker } from "./LabelPicker";
import { Button, Field, TextArea, TextInput } from "./ui/controls";
import { cn } from "../lib/cn";

interface Props {
  task: Task | undefined;
  column: ColumnId | undefined;
  labels: Label[];
  dispatch: (action: BoardAction) => void;
  onClose: () => void;
}

export function TaskDialog({ task, column, labels, dispatch, onClose }: Props) {
  const open = Boolean(task);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            "bg-surface border-line fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[min(34rem,calc(100vw-2rem))]",
            "-translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border p-5 shadow-2xl outline-none",
            "transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          )}
        >
          {task && column && (
            <TaskDialogBody task={task} column={column} labels={labels} dispatch={dispatch} onClose={onClose} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TaskDialogBody({
  task,
  column,
  labels,
  dispatch,
  onClose,
}: {
  task: Task;
  column: ColumnId;
  labels: Label[];
  dispatch: (action: BoardAction) => void;
  onClose: () => void;
}) {
  const columnTitle = COLUMNS.find((entry) => entry.id === column)?.title ?? column;
  const nameIsEmpty = task.name.trim().length === 0;

  const update = (changes: Partial<Omit<Task, "id">>) => dispatch({ type: "update-task", id: task.id, changes });

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Dialog.Title className="text-ink text-base font-semibold">Task details</Dialog.Title>
          <Dialog.Description className="text-ink-faint mt-0.5 text-xs">In {columnTitle}</Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="text-ink-faint hover:bg-surface-hover hover:text-ink shrink-0 rounded-md p-1.5 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </Dialog.Close>
      </div>

      <div className="flex flex-col gap-4">
        <Field label="Task name" hint={nameIsEmpty ? "A task name is required." : undefined}>
          <TextInput
            autoFocus
            value={task.name}
            placeholder="What needs doing?"
            aria-invalid={nameIsEmpty}
            onChange={(event) => update({ name: event.target.value })}
            className={cn(nameIsEmpty && "border-overdue")}
          />
        </Field>

        <Field label="Description">
          <TextArea
            rows={3}
            value={task.description}
            placeholder="Add more detail (optional)"
            onChange={(event) => update({ description: event.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date">
            <TextInput
              type="date"
              value={task.dueDate ?? ""}
              onChange={(event) => update({ dueDate: event.target.value || null })}
            />
          </Field>

          <Field label="Weight">
            <NumberField.Root
              value={task.weight}
              min={0}
              onValueChange={(value) => update({ weight: value })}
              className="w-full"
            >
              <NumberField.Group className="border-line hover:border-line-strong focus-within:ring-accent/70 flex rounded-md border transition-colors focus-within:ring-2">
                <NumberField.Decrement className="text-ink-muted hover:bg-surface-hover hover:text-ink w-9 rounded-l-md transition-colors">
                  −
                </NumberField.Decrement>
                <NumberField.Input
                  placeholder="—"
                  className="text-ink placeholder:text-ink-faint bg-bg w-full min-w-0 border-x-0 px-2 py-2 text-center text-sm focus:outline-none"
                />
                <NumberField.Increment className="text-ink-muted hover:bg-surface-hover hover:text-ink w-9 rounded-r-md transition-colors">
                  +
                </NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </Field>
        </div>

        <LabelPicker
          labels={labels}
          selectedIds={task.labelIds}
          onToggle={(labelId) => dispatch({ type: "toggle-task-label", taskId: task.id, labelId })}
          onCreate={(name, color: LabelColor) =>
            dispatch({
              type: "create-label",
              label: { id: crypto.randomUUID(), name, color },
              taskId: task.id,
            })
          }
          onRename={(labelId, name) => dispatch({ type: "update-label", id: labelId, changes: { name } })}
          onRecolor={(labelId, color) => dispatch({ type: "update-label", id: labelId, changes: { color } })}
        />

        <ChecklistEditor
          items={task.checklist}
          onAdd={(text) => dispatch({ type: "add-checklist-item", taskId: task.id, itemId: crypto.randomUUID(), text })}
          onToggle={(itemId, done) =>
            dispatch({ type: "update-checklist-item", taskId: task.id, itemId, changes: { done } })
          }
          onRename={(itemId, text) =>
            dispatch({ type: "update-checklist-item", taskId: task.id, itemId, changes: { text } })
          }
          onRemove={(itemId) => dispatch({ type: "remove-checklist-item", taskId: task.id, itemId })}
        />
      </div>

      <div className="border-line mt-5 flex items-center justify-between border-t pt-4">
        <Button
          variant="danger"
          onClick={() => {
            dispatch({ type: "delete-task", id: task.id });
            onClose();
          }}
        >
          Delete task
        </Button>
        <Button variant="primary" onClick={onClose} disabled={nameIsEmpty}>
          Done
        </Button>
      </div>
    </>
  );
}
