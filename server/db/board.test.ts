import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { boardStateSchema } from "../../shared/schema.ts";
import { assembleBoard } from "./board.ts";
import type { BoardRows } from "./board.ts";

const TASK_A = "11111111-1111-4111-8111-111111111111";
const TASK_B = "22222222-2222-4222-8222-222222222222";
const TASK_C = "33333333-3333-4333-8333-333333333333";
const LABEL_X = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LABEL_Y = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ITEM_1 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ITEM_2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function rows(overrides: Partial<BoardRows> = {}): BoardRows {
  return { taskRows: [], checklistRows: [], labelRows: [], taskLabelRows: [], ...overrides };
}

function task(id: string, columnId: string, position: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    name: `Task ${id.slice(0, 4)}`,
    description: "",
    dueDate: null,
    weight: null,
    columnId,
    position,
    ...extra,
  } as BoardRows["taskRows"][number];
}

describe("assembleBoard", () => {
  it("returns every column, even with no tasks", () => {
    const board = assembleBoard(rows());
    assert.deepEqual(Object.keys(board.columns).sort(), ["backlog", "done", "in-progress", "todo"]);
    assert.deepEqual(board.columns.backlog, []);
    assert.deepEqual(board.tasks, {});
    assert.deepEqual(board.labels, []);
  });

  it("preserves column ordering from the position column", () => {
    // Deliberately supplied in position order, as the query guarantees.
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_C, "todo", 0), task(TASK_A, "todo", 1), task(TASK_B, "todo", 2)],
    });
    assert.deepEqual(board.columns.todo, [TASK_C, TASK_A, TASK_B]);
  });

  it("splits tasks across their own columns", () => {
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_A, "backlog", 0), task(TASK_B, "done", 0), task(TASK_C, "done", 1)],
    });
    assert.deepEqual(board.columns.backlog, [TASK_A]);
    assert.deepEqual(board.columns.done, [TASK_B, TASK_C]);
    assert.deepEqual(board.columns.todo, []);
  });

  it("keeps checklist items with their task, in order", () => {
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_A, "todo", 0), task(TASK_B, "todo", 1)],
      checklistRows: [
        { id: ITEM_1, taskId: TASK_A, text: "first", done: true, position: 0 },
        { id: ITEM_2, taskId: TASK_A, text: "second", done: false, position: 1 },
      ],
    });
    assert.deepEqual(board.tasks[TASK_A].checklist, [
      { id: ITEM_1, text: "first", done: true },
      { id: ITEM_2, text: "second", done: false },
    ]);
    assert.deepEqual(board.tasks[TASK_B].checklist, []);
  });

  it("attaches label ids from the join table", () => {
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_A, "todo", 0), task(TASK_B, "todo", 1)],
      labelRows: [
        { id: LABEL_X, name: "Bug", color: "red", position: 0 },
        { id: LABEL_Y, name: "Chore", color: "blue", position: 1 },
      ],
      taskLabelRows: [
        { taskId: TASK_A, labelId: LABEL_X },
        { taskId: TASK_A, labelId: LABEL_Y },
      ],
    });
    assert.deepEqual(board.tasks[TASK_A].labelIds, [LABEL_X, LABEL_Y]);
    assert.deepEqual(board.tasks[TASK_B].labelIds, []);
    assert.deepEqual(
      board.labels.map((l) => l.name),
      ["Bug", "Chore"],
    );
  });

  it("preserves null due dates and weights rather than coercing them", () => {
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_A, "todo", 0, { dueDate: "2026-03-14", weight: 0 }), task(TASK_B, "todo", 1)],
    });
    assert.equal(board.tasks[TASK_A].dueDate, "2026-03-14");
    assert.equal(board.tasks[TASK_A].weight, 0, "weight 0 must survive, not become null");
    assert.equal(board.tasks[TASK_B].dueDate, null);
    assert.equal(board.tasks[TASK_B].weight, null);
  });

  it("drops tasks in unknown columns instead of failing the whole board", () => {
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_A, "todo", 0), task(TASK_B, "archived", 0)],
    });
    assert.deepEqual(Object.keys(board.tasks), [TASK_A]);
    assert.deepEqual(Object.keys(board.columns).sort(), ["backlog", "done", "in-progress", "todo"]);
  });

  it("produces a board that satisfies the shared schema", () => {
    const board = assembleBoard({
      ...rows(),
      taskRows: [task(TASK_A, "todo", 0, { dueDate: "2026-01-01", weight: 3 })],
      checklistRows: [{ id: ITEM_1, taskId: TASK_A, text: "x", done: false, position: 0 }],
      labelRows: [{ id: LABEL_X, name: "Bug", color: "red", position: 0 }],
      taskLabelRows: [{ taskId: TASK_A, labelId: LABEL_X }],
    });
    // The API contract and the assembler must not drift apart.
    assert.doesNotThrow(() => boardStateSchema.parse(board));
  });
});
