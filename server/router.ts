import { os } from "@orpc/server";
import * as z from "zod";
import {
  checklistItemSchema,
  columnIdSchema,
  columnMapSchema,
  labelColorSchema,
  labelSchema,
  taskPatchSchema,
} from "../shared/schema.ts";
import { db } from "./db/client.ts";
import * as board from "./db/board.ts";

export const router = {
  board: {
    get: os.handler(() => board.loadBoard(db)),

    /**
     * Takes the whole settled column map rather than a single move: it's exactly
     * what the reducer produces on drop, it's atomic, and it's idempotent so a
     * retry can't corrupt ordering.
     */
    reorder: os.input(z.object({ columns: columnMapSchema })).handler(async ({ input }) => {
      await board.reorder(db, input.columns);
    }),
  },

  tasks: {
    create: os
      .input(z.object({ id: z.uuid(), column: columnIdSchema, name: z.string() }))
      .handler(async ({ input }) => {
        await board.createTask(db, input);
      }),

    update: os.input(z.object({ id: z.uuid(), patch: taskPatchSchema })).handler(async ({ input }) => {
      await board.updateTask(db, input.id, input.patch);
    }),

    delete: os.input(z.object({ id: z.uuid() })).handler(async ({ input }) => {
      await board.deleteTask(db, input.id);
    }),
  },

  labels: {
    create: os.input(z.object({ label: labelSchema })).handler(async ({ input }) => {
      await board.createLabel(db, input.label);
    }),

    update: os
      .input(
        z.object({
          id: z.uuid(),
          patch: z.object({ name: z.string().optional(), color: labelColorSchema.optional() }),
        }),
      )
      .handler(async ({ input }) => {
        await board.updateLabel(db, input.id, input.patch);
      }),

    setOnTask: os
      .input(z.object({ taskId: z.uuid(), labelId: z.uuid(), applied: z.boolean() }))
      .handler(async ({ input }) => {
        await board.setTaskLabel(db, input.taskId, input.labelId, input.applied);
      }),
  },

  checklist: {
    add: os.input(z.object({ taskId: z.uuid(), item: checklistItemSchema })).handler(async ({ input }) => {
      await board.addChecklistItem(db, input.taskId, input.item);
    }),

    update: os
      .input(
        z.object({
          id: z.uuid(),
          patch: z.object({ text: z.string().optional(), done: z.boolean().optional() }),
        }),
      )
      .handler(async ({ input }) => {
        await board.updateChecklistItem(db, input.id, input.patch);
      }),

    remove: os.input(z.object({ id: z.uuid() })).handler(async ({ input }) => {
      await board.removeChecklistItem(db, input.id);
    }),
  },
};

export type AppRouter = typeof router;
