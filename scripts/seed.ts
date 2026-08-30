/**
 * Development seed. A fresh install starts empty on purpose — this exists so
 * there's something to look at while working on the board.
 *
 * Run with: npm run db:seed
 */
import { db, pool } from "../server/db/client.ts";
import * as board from "../server/db/board.ts";
import type { ColumnId, Label } from "../shared/schema.ts";

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const LABELS: Label[] = [
  { id: crypto.randomUUID(), name: "Bug", color: "red" },
  { id: crypto.randomUUID(), name: "Feature", color: "green" },
  { id: crypto.randomUUID(), name: "Chore", color: "blue" },
  { id: crypto.randomUUID(), name: "Urgent", color: "orange" },
];
const [bug, feature, chore, urgent] = LABELS;

interface SeedTask {
  name: string;
  column: ColumnId;
  description?: string;
  dueDate?: string;
  weight?: number;
  labels?: Label[];
  checklist?: [string, boolean][];
}

const TASKS: SeedTask[] = [
  {
    name: "Sketch the mobile layout",
    column: "backlog",
    description: "Columns should collapse to a single scrollable stack under 768px.",
    dueDate: daysFromNow(12),
    weight: 3,
    labels: [feature],
  },
  { name: "Research self-hosted deploy options", column: "backlog" },
  {
    name: "Add keyboard shortcuts",
    column: "todo",
    description: "At minimum: N for a new card, Escape to close the dialog.",
    dueDate: daysFromNow(21),
    weight: 5,
    labels: [feature, chore],
    checklist: [
      ["Pick a shortcut library or hand-roll", false],
      ["Document the bindings in the README", false],
    ],
  },
  {
    name: "Fix card drop target flicker",
    column: "todo",
    description: "The placeholder jumps when dragging between columns quickly.",
    dueDate: daysFromNow(-2),
    weight: 2,
    labels: [bug, urgent],
    checklist: [
      ["Reproduce with a slow CPU throttle", true],
      ["Narrow down the collision detector", false],
      ["Verify on touch devices", false],
    ],
  },
  {
    name: "Wire up the persistence layer",
    column: "in-progress",
    description: "oRPC over Postgres, with the reducer staying the source of truth.",
    dueDate: daysFromNow(3),
    weight: 8,
    labels: [feature],
    checklist: [
      ["Decide on a storage shape", true],
      ["Handle schema migrations", false],
    ],
  },
  { name: "Set up the dark theme tokens", column: "done", weight: 2, labels: [chore] },
  {
    name: "Scaffold the project",
    column: "done",
    description: "Vite, React, TypeScript, Tailwind.",
    weight: 1,
    labels: [chore],
    checklist: [["Wire up Prettier", true]],
  },
];

async function main() {
  if (!(await board.isEmpty(db))) {
    console.error("The board already has tasks. Refusing to seed over existing data.");
    process.exitCode = 1;
    return;
  }

  for (const label of LABELS) await board.createLabel(db, label);

  // Insert bottom-up: createTask puts each new card at the top of its column,
  // so reversing here preserves the order written above.
  for (const task of [...TASKS].reverse()) {
    const id = crypto.randomUUID();
    await board.createTask(db, { id, column: task.column, name: task.name });
    await board.updateTask(db, id, {
      description: task.description ?? "",
      dueDate: task.dueDate ?? null,
      weight: task.weight ?? null,
    });
    for (const label of task.labels ?? []) {
      await board.setTaskLabel(db, id, label.id, true);
    }
    for (const [text, done] of task.checklist ?? []) {
      await board.addChecklistItem(db, id, { id: crypto.randomUUID(), text, done });
    }
  }

  console.log(`Seeded ${TASKS.length} tasks and ${LABELS.length} labels.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
