import type { BoardState } from "../types";

/** Offsets from today so the seed board always has a genuinely overdue and a due-soon card. */
function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function createSeedBoard(): BoardState {
  return {
    labels: [
      { id: "label-bug", name: "Bug", color: "red" },
      { id: "label-feature", name: "Feature", color: "green" },
      { id: "label-chore", name: "Chore", color: "blue" },
      { id: "label-urgent", name: "Urgent", color: "orange" },
    ],
    tasks: {
      "task-1": {
        id: "task-1",
        name: "Sketch the mobile layout",
        description: "Columns should collapse to a single scrollable stack under 768px.",
        dueDate: daysFromNow(12),
        weight: 3,
        labelIds: ["label-feature"],
        checklist: [],
      },
      "task-2": {
        id: "task-2",
        name: "Research self-hosted deploy options",
        description: "",
        dueDate: null,
        weight: null,
        labelIds: [],
        checklist: [],
      },
      "task-3": {
        id: "task-3",
        name: "Add keyboard shortcuts",
        description: "At minimum: N for a new card, Escape to close the dialog.",
        dueDate: daysFromNow(21),
        weight: 5,
        labelIds: ["label-feature", "label-chore"],
        checklist: [
          { id: "check-3a", text: "Pick a shortcut library or hand-roll", done: false },
          { id: "check-3b", text: "Document the bindings in the README", done: false },
        ],
      },
      "task-4": {
        id: "task-4",
        name: "Fix card drop target flicker",
        description: "The placeholder jumps when dragging between columns quickly.",
        dueDate: daysFromNow(-2),
        weight: 2,
        labelIds: ["label-bug", "label-urgent"],
        checklist: [
          { id: "check-4a", text: "Reproduce with a slow CPU throttle", done: true },
          { id: "check-4b", text: "Narrow down the collision detector", done: false },
          { id: "check-4c", text: "Verify on touch devices", done: false },
        ],
      },
      "task-5": {
        id: "task-5",
        name: "Write the persistence layer",
        description: "Start with localStorage, leave room for a real backend later.",
        dueDate: daysFromNow(3),
        weight: 8,
        labelIds: ["label-feature"],
        checklist: [
          { id: "check-5a", text: "Decide on a storage shape", done: true },
          { id: "check-5b", text: "Handle schema migrations", done: false },
        ],
      },
      "task-6": {
        id: "task-6",
        name: "Set up the dark theme tokens",
        description: "",
        dueDate: null,
        weight: 2,
        labelIds: ["label-chore"],
        checklist: [],
      },
      "task-7": {
        id: "task-7",
        name: "Scaffold the project",
        description: "Vite, React, TypeScript, Tailwind.",
        dueDate: null,
        weight: 1,
        labelIds: ["label-chore"],
        checklist: [{ id: "check-7a", text: "Wire up Prettier", done: true }],
      },
    },
    columns: {
      backlog: ["task-1", "task-2"],
      todo: ["task-3", "task-4"],
      "in-progress": ["task-5"],
      done: ["task-6", "task-7"],
    },
  };
}
