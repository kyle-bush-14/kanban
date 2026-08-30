import { COLUMN_IDS } from "../shared/constants";
import type { ColumnId } from "../shared/schema";

/** Data types live in shared/ so the client, server and API validation agree on one definition. */
export type { BoardState, ChecklistItem, ColumnId, Label, LabelColor, Task, TaskPatch } from "../shared/schema";
export { LABEL_COLORS, COLUMN_IDS } from "../shared/constants";

/** Column ids paired with their display titles. Order here is the on-screen order. */
export const COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
] as const satisfies readonly { id: ColumnId; title: string }[];

export const DONE_COLUMN: ColumnId = "done";

export function isColumnId(value: unknown): value is ColumnId {
  return (COLUMN_IDS as readonly string[]).includes(value as string);
}
