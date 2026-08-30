import { and, asc, eq, sql } from "drizzle-orm";
import { COLUMN_IDS } from "../../shared/schema.ts";
import type { BoardState, ChecklistItem, ColumnId, Label, LabelColor, Task, TaskPatch } from "../../shared/schema.ts";
import type { Db } from "./client.ts";
import { checklistItems, labels, taskLabels, tasks } from "./schema.ts";

export interface TaskRow {
  id: string;
  name: string;
  description: string;
  dueDate: string | null;
  weight: number | null;
  columnId: string;
  position: number;
}
export interface ChecklistRow {
  id: string;
  taskId: string;
  text: string;
  done: boolean;
  position: number;
}
export interface LabelRow {
  id: string;
  name: string;
  color: string;
  position: number;
}
export interface TaskLabelRow {
  taskId: string;
  labelId: string;
}

export interface BoardRows {
  /** Must arrive ordered by (columnId, position). */
  taskRows: TaskRow[];
  /** Must arrive ordered by (taskId, position). */
  checklistRows: ChecklistRow[];
  /** Must arrive ordered by position. */
  labelRows: LabelRow[];
  taskLabelRows: TaskLabelRow[];
}

function emptyColumns(): Record<ColumnId, string[]> {
  return Object.fromEntries(COLUMN_IDS.map((id) => [id, [] as string[]])) as Record<ColumnId, string[]>;
}

/**
 * Rows -> the exact BoardState shape the client already uses. Kept pure and
 * separate from querying so it can be tested without a database; this is where
 * schema drift would show up first.
 *
 * Rows for unknown column ids are dropped rather than throwing: a column removed
 * from the app shouldn't make the whole board unloadable.
 */
export function assembleBoard(rows: BoardRows): BoardState {
  const columns = emptyColumns();
  const known = new Set<string>(COLUMN_IDS);

  const checklistByTask = new Map<string, ChecklistItem[]>();
  for (const row of rows.checklistRows) {
    const list = checklistByTask.get(row.taskId) ?? [];
    list.push({ id: row.id, text: row.text, done: row.done });
    checklistByTask.set(row.taskId, list);
  }

  const labelIdsByTask = new Map<string, string[]>();
  for (const row of rows.taskLabelRows) {
    const list = labelIdsByTask.get(row.taskId) ?? [];
    list.push(row.labelId);
    labelIdsByTask.set(row.taskId, list);
  }

  const taskMap: Record<string, Task> = {};
  for (const row of rows.taskRows) {
    if (!known.has(row.columnId)) continue;
    taskMap[row.id] = {
      id: row.id,
      name: row.name,
      description: row.description,
      dueDate: row.dueDate,
      weight: row.weight,
      labelIds: labelIdsByTask.get(row.id) ?? [],
      checklist: checklistByTask.get(row.id) ?? [],
    };
    columns[row.columnId as ColumnId].push(row.id);
  }

  const labelList: Label[] = rows.labelRows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color as LabelColor,
  }));

  return { tasks: taskMap, columns, labels: labelList };
}

export async function loadBoard(db: Db): Promise<BoardState> {
  const [taskRows, checklistRows, labelRows, taskLabelRows] = await Promise.all([
    db.select().from(tasks).orderBy(asc(tasks.columnId), asc(tasks.position)),
    db.select().from(checklistItems).orderBy(asc(checklistItems.taskId), asc(checklistItems.position)),
    db.select().from(labels).orderBy(asc(labels.position)),
    db.select().from(taskLabels),
  ]);

  return assembleBoard({ taskRows, checklistRows, labelRows, taskLabelRows });
}

export async function createTask(db: Db, input: { id: string; column: ColumnId; name: string }): Promise<void> {
  // New cards go to the top of their column, matching the reducer.
  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(eq(tasks.columnId, input.column));
    await tx.insert(tasks).values({
      id: input.id,
      name: input.name,
      description: "",
      dueDate: null,
      weight: null,
      columnId: input.column,
      position: 0,
    });
  });
}

export async function updateTask(db: Db, id: string, patch: TaskPatch): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await db.update(tasks).set(patch).where(eq(tasks.id, id));
}

export async function deleteTask(db: Db, id: string): Promise<void> {
  // checklist_items and task_labels cascade.
  await db.delete(tasks).where(eq(tasks.id, id));
}

/**
 * Rewrite column membership and ordering from the settled column map the client
 * produces on drop. Renumbering the whole board is trivial at this scale and is
 * idempotent, which matters because reorder calls can be retried.
 */
export async function reorder(db: Db, columns: Record<ColumnId, string[]>): Promise<void> {
  await db.transaction(async (tx) => {
    for (const columnId of COLUMN_IDS) {
      const ids = columns[columnId] ?? [];
      for (const [position, id] of ids.entries()) {
        await tx.update(tasks).set({ columnId, position }).where(eq(tasks.id, id));
      }
    }
  });
}

export async function createLabel(db: Db, label: Label): Promise<void> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(labels);
  await db.insert(labels).values({ ...label, position: count });
}

export async function updateLabel(db: Db, id: string, patch: { name?: string; color?: LabelColor }): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await db.update(labels).set(patch).where(eq(labels.id, id));
}

export async function setTaskLabel(db: Db, taskId: string, labelId: string, applied: boolean): Promise<void> {
  if (applied) {
    await db.insert(taskLabels).values({ taskId, labelId }).onConflictDoNothing();
  } else {
    await db.delete(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));
  }
}

export async function addChecklistItem(db: Db, taskId: string, item: ChecklistItem): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(checklistItems)
    .where(eq(checklistItems.taskId, taskId));
  await db.insert(checklistItems).values({ ...item, taskId, position: count });
}

export async function updateChecklistItem(db: Db, id: string, patch: { text?: string; done?: boolean }): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await db.update(checklistItems).set(patch).where(eq(checklistItems.id, id));
}

export async function removeChecklistItem(db: Db, id: string): Promise<void> {
  await db.delete(checklistItems).where(eq(checklistItems.id, id));
}

/** Used by the seed script to decide whether the board is already populated. */
export async function isEmpty(db: Db): Promise<boolean> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(tasks);
  return count === 0;
}
