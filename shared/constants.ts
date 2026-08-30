/**
 * Plain constants, deliberately free of any zod import: the client needs these
 * values but never validates anything, and pulling schema.ts in would ship the
 * whole zod runtime to the browser for nothing.
 */
export const COLUMN_IDS = ["backlog", "todo", "in-progress", "done"] as const;

export const LABEL_COLORS = ["red", "orange", "yellow", "green", "blue", "purple"] as const;
