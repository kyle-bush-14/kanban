import { boolean, date, integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** `mode: "string"` keeps this as ISO `yyyy-mm-dd` rather than a JS Date, matching the client shape. */
  dueDate: date("due_date", { mode: "string" }),
  weight: integer("weight"),
  /**
   * Plain text rather than a pgEnum: the Zod ColumnId union guards it at the API
   * boundary, and text avoids an enum migration if the columns ever change.
   */
  columnId: text("column_id").notNull(),
  /** Position within its column. Contiguous integers, renumbered on reorder. */
  position: integer("position").notNull(),
});

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull(),
});

export const labels = pgTable("labels", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  position: integer("position").notNull(),
});

export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);
