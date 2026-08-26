import { move } from "@dnd-kit/helpers";
import type { DragOverEvent } from "@dnd-kit/react";
import type { BoardState, ChecklistItem, ColumnId, Label, Task } from "../types";

/**
 * Every action carries any generated id from the caller, so the reducer stays
 * pure and deterministic — no `crypto.randomUUID()` or `Date.now()` in here.
 */
export type BoardAction =
  | { type: "set-columns"; columns: Record<ColumnId, string[]> }
  | { type: "drag-over"; event: DragOverEvent }
  | { type: "create-task"; id: string; column: ColumnId; name: string }
  | { type: "update-task"; id: string; changes: Partial<Omit<Task, "id">> }
  | { type: "delete-task"; id: string }
  | { type: "add-checklist-item"; taskId: string; itemId: string; text: string }
  | { type: "update-checklist-item"; taskId: string; itemId: string; changes: Partial<Omit<ChecklistItem, "id">> }
  | { type: "remove-checklist-item"; taskId: string; itemId: string }
  | { type: "create-label"; label: Label; taskId?: string }
  | { type: "update-label"; id: string; changes: Partial<Omit<Label, "id">> }
  | { type: "toggle-task-label"; taskId: string; labelId: string };

function updateTask(state: BoardState, id: string, update: (task: Task) => Task): BoardState {
  const task = state.tasks[id];
  if (!task) return state;
  return { ...state, tasks: { ...state.tasks, [id]: update(task) } };
}

function updateChecklist(
  state: BoardState,
  taskId: string,
  update: (checklist: ChecklistItem[]) => ChecklistItem[],
): BoardState {
  return updateTask(state, taskId, (task) => ({ ...task, checklist: update(task.checklist) }));
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    /**
     * Reorder optimistically as a card is dragged. Doing this in the reducer
     * rather than the event handler guarantees `move` always sees the current
     * column map, even when several dragover events land between renders.
     */
    case "drag-over":
      return { ...state, columns: move(state.columns, action.event) };

    /** Used to restore the pre-drag snapshot when a drag is canceled. */
    case "set-columns":
      return { ...state, columns: action.columns };

    case "create-task": {
      const task: Task = {
        id: action.id,
        name: action.name,
        description: "",
        dueDate: null,
        weight: null,
        labelIds: [],
        checklist: [],
      };
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: task },
        columns: { ...state.columns, [action.column]: [action.id, ...state.columns[action.column]] },
      };
    }

    case "update-task":
      return updateTask(state, action.id, (task) => ({ ...task, ...action.changes }));

    case "delete-task": {
      const tasks = { ...state.tasks };
      delete tasks[action.id];
      const columns = {} as Record<ColumnId, string[]>;
      for (const [column, ids] of Object.entries(state.columns) as [ColumnId, string[]][]) {
        columns[column] = ids.filter((id) => id !== action.id);
      }
      return { ...state, tasks, columns };
    }

    case "add-checklist-item":
      return updateChecklist(state, action.taskId, (checklist) => [
        ...checklist,
        { id: action.itemId, text: action.text, done: false },
      ]);

    case "update-checklist-item":
      return updateChecklist(state, action.taskId, (checklist) =>
        checklist.map((item) => (item.id === action.itemId ? { ...item, ...action.changes } : item)),
      );

    case "remove-checklist-item":
      return updateChecklist(state, action.taskId, (checklist) =>
        checklist.filter((item) => item.id !== action.itemId),
      );

    case "create-label": {
      const withLabel = { ...state, labels: [...state.labels, action.label] };
      if (!action.taskId) return withLabel;
      return updateTask(withLabel, action.taskId, (task) => ({
        ...task,
        labelIds: [...task.labelIds, action.label.id],
      }));
    }

    case "update-label":
      return {
        ...state,
        labels: state.labels.map((label) => (label.id === action.id ? { ...label, ...action.changes } : label)),
      };

    case "toggle-task-label":
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        labelIds: task.labelIds.includes(action.labelId)
          ? task.labelIds.filter((id) => id !== action.labelId)
          : [...task.labelIds, action.labelId],
      }));

    default:
      return state;
  }
}

/** Which column a task currently sits in, or undefined if it isn't on the board. */
export function findColumn(columns: Record<ColumnId, string[]>, taskId: string): ColumnId | undefined {
  for (const [column, ids] of Object.entries(columns) as [ColumnId, string[]][]) {
    if (ids.includes(taskId)) return column;
  }
  return undefined;
}
