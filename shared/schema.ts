import * as z from "zod";
import { COLUMN_IDS, LABEL_COLORS } from "./constants.ts";

export { COLUMN_IDS, LABEL_COLORS };
export const columnIdSchema = z.enum(COLUMN_IDS);
export type ColumnId = z.infer<typeof columnIdSchema>;

export const labelColorSchema = z.enum(LABEL_COLORS);
export type LabelColor = z.infer<typeof labelColorSchema>;

export const labelSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: labelColorSchema,
});
export type Label = z.infer<typeof labelSchema>;

export const checklistItemSchema = z.object({
  id: z.uuid(),
  text: z.string(),
  done: z.boolean(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

/** ISO `yyyy-mm-dd`. Deliberately a plain date — the board has no notion of time of day. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO yyyy-mm-dd date");

export const taskSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  dueDate: isoDateSchema.nullable(),
  weight: z.number().int().nullable(),
  labelIds: z.array(z.uuid()),
  checklist: z.array(checklistItemSchema),
});
export type Task = z.infer<typeof taskSchema>;

/** Ordered task ids per column — the source of truth for card order. */
export const columnMapSchema = z.record(columnIdSchema, z.array(z.uuid()));

export const boardStateSchema = z.object({
  tasks: z.record(z.uuid(), taskSchema),
  columns: columnMapSchema,
  labels: z.array(labelSchema),
});
export type BoardState = z.infer<typeof boardStateSchema>;

/** Fields a client may change on a task. Ids and ordering are handled elsewhere. */
export const taskPatchSchema = taskSchema
  .pick({ name: true, description: true, dueDate: true, weight: true })
  .partial();
export type TaskPatch = z.infer<typeof taskPatchSchema>;
