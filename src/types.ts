export const COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
] as const;

export type ColumnId = (typeof COLUMNS)[number]["id"];

export const DONE_COLUMN: ColumnId = "done";

export const LABEL_COLORS = ["red", "orange", "yellow", "green", "blue", "purple"] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  /** ISO `yyyy-mm-dd`, or null when no due date is set. */
  dueDate: string | null;
  weight: number | null;
  labelIds: string[];
  checklist: ChecklistItem[];
}

export interface BoardState {
  tasks: Record<string, Task>;
  /** Ordered task ids per column. This is the source of truth for card order. */
  columns: Record<ColumnId, string[]>;
  labels: Label[];
}

export function isColumnId(value: unknown): value is ColumnId {
  return COLUMNS.some((column) => column.id === value);
}
