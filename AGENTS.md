# AGENTS.md

Context for coding agents working in this repository. Written to save you from
re-deriving things that already cost someone a debugging session.

## What this is

A self-hosted personal kanban board. Four fixed columns (Backlog, To Do, In
Progress, Done), cards dragged between them, click a card to edit its details.
Moving a card into Done fires confetti and crosses out its name.

Single-page app, no backend, no auth, one board.

## Commands

```bash
npm run dev           # Vite dev server on :5173
npm run build         # tsc -b && vite build
npm run typecheck     # tsc -b only
npm run lint          # eslint .
npm run format        # prettier --write .
npm run format:check  # prettier --check .  (what CI runs)
```

CI (`.github/workflows/ci.yml`) runs `format:check`, `lint`, and `build` on every
PR to `main`. Run all three before pushing. There is no test runner.

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind v4 · Base UI 1.7 · @dnd-kit/react 0.5
· lucide-react · canvas-confetti

## Things that will bite you

These are the non-obvious ones. Read them before touching the relevant area.

### dnd-kit is the new API, not the one in every tutorial

This project uses **`@dnd-kit/react` 0.5**, not the classic `@dnd-kit/core` +
`@dnd-kit/sortable`. The APIs are different and the old one is not installed.

- `DragDropProvider`, not `DndContext`
- `useSortable({ id, index, group })` returns **ref callbacks** (`ref`,
  `handleRef`, `sourceRef`, `targetRef`) — there is no `attributes`,
  `listeners`, or `transform` to spread
- `group` is the cross-container mechanism; here it's the column id

Almost every kanban example online targets the old API and will not compile.

### Column droppable ids must equal the column key

`move()` from `@dnd-kit/helpers` resolves a drop target by looking its id up as
a key in the columns record. A column's droppable id must therefore be exactly
`"backlog"` / `"todo"` / `"in-progress"` / `"done"`. Prefixing it (e.g.
`column:${id}`) makes dropping onto an empty column a **silent no-op** — no
error, nothing happens. This has already been fixed once; don't reintroduce it.

### StrictMode is deliberately omitted

`src/main.tsx` does not wrap the app in `<StrictMode>`. Its development-only
double-mount leaves @dnd-kit/react 0.5 with unbound pointer sensors, which
silently breaks all dragging in dev. There's a comment saying so. Don't "fix"
it. Re-check once dnd-kit handles double-invoked effects; production builds are
unaffected either way.

### Space drags, Enter opens

dnd-kit's `KeyboardSensor` binds Space _and_ Enter to start a drag by default,
which collided with the card's Enter-to-open handler. `Board.tsx` reconfigures
it to Space only. If you add keyboard handlers to cards, check for collisions.

### TypeScript config is unusual

`tsconfig.app.json` sets flags that break ordinary-looking code:

- `verbatimModuleSyntax` — type-only imports **must** use `import type`
- `erasableSyntaxOnly` — **no `enum`**, no parameter properties, no namespaces.
  Use `as const` unions (see `COLUMNS` / `ColumnId` in `src/types.ts`)
- `noUnusedLocals` / `noUnusedParameters` — an unused variable **fails the
  build**, so removing the last use of an import means removing the import too
- Note `strict` is **not** set

### Tailwind v4, and dynamic class names don't work

CSS-first: no `tailwind.config.js`. All design tokens live in an `@theme` block
in `src/index.css` (`--color-bg`, `--color-surface`, `--color-ink`,
`--color-overdue`, `--color-label-*`, …). Add new tokens there and use them as
normal utilities (`bg-surface`, `text-ink-muted`).

Tailwind scans source as **text**, so `bg-label-${color}` generates nothing.
Colour-keyed classes need full literal strings in a lookup map — that's what
`src/lib/labelStyles.ts` exists for.

Dark theme only. There are no `dark:` variants; one palette, applied directly.

### Base UI, not Radix or shadcn

Headless primitives come from `@base-ui/react` (`@base-ui/react/dialog`,
`/popover`, `/checkbox`, `/number-field`). Do **not** run `npx shadcn init` —
it generates Radix-based components and would duplicate the primitive layer.

Popovers rendered inside the task dialog need a z-index above it: the dialog
popup is `z-50`, so `Popover.Positioner` gets `z-60`. Without it the popover
renders behind the dialog.

### Confetti is derived from state, not from the drag

`Board.tsx` fires confetti in an effect that diffs the Done column against its
last _settled_ contents, gated on no drag being in flight. It is deliberately
not triggered from drag handlers: dragging optimistically reorders mid-drag, so
a handler-based trigger fires while the card is still moving and re-fires on
reorders within Done. If you touch this, verify all three cases — entering Done
(fires once), reordering within Done (doesn't fire), leaving Done (doesn't fire).

`celebrate()` no-ops under `prefers-reduced-motion`; the strikethrough still
conveys the state change.

## Architecture

```
src/
  types.ts              COLUMNS, ColumnId, Task, Label, BoardState
  state/
    boardReducer.ts     all board mutations + findColumn()
    seed.ts             initial demo board
  lib/
    cn.ts               class joiner (no clsx dependency)
    date.ts             due-date formatting and overdue/due-soon status
    labelStyles.ts      colour -> literal Tailwind class maps
    confetti.ts         celebrate(), reduced-motion aware
  components/
    Board.tsx           DragDropProvider, sensors, reducer, confetti effect
    Column.tsx          column shell + column-level droppable
    TaskCard.tsx        useSortable; also exports TaskCardContent for the overlay
    CardBadges.tsx      weight / due date / checklist / labels
    TaskDialog.tsx      Base UI Dialog with every editable field
    ChecklistEditor.tsx
    LabelPicker.tsx     board-level label set: pick, create, rename, recolor
    ui/controls.tsx     TextInput, TextArea, Button, Field
```

### State model

One serializable object in a `useReducer`:

```ts
interface BoardState {
  tasks: Record<string, Task>;
  columns: Record<ColumnId, string[]>; // ordered task ids — source of truth for order
  labels: Label[];
}
```

Actions: `drag-over`, `set-columns`, `create-task`, `update-task`, `delete-task`,
`add-checklist-item`, `update-checklist-item`, `remove-checklist-item`,
`create-label`, `update-label`, `toggle-task-label`.

The reducer is **pure**: ids are generated by callers with `crypto.randomUUID()`
and passed in the action, never inside the reducer. Keep it that way — it makes
the whole thing testable and the state a clean JSON blob.

**There is no persistence yet.** State resets on reload; this is intentional and
planned for later. The shape above is designed so a storage layer drops in
without restructuring components.

## Conventions

- Prettier, `printWidth: 120`, with `prettier-plugin-tailwindcss` sorting classes.
  Double quotes, semicolons, trailing commas — all Prettier defaults.
- Icons from `lucide-react` (`<Check size={14} />`). It sets `aria-hidden="true"`
  itself, so icon-only state needs a real ARIA attribute — see `aria-pressed` on
  the label toggles.
- Badges on cards render **only** when their field is filled in. A card with no
  optional fields shows just its name.
- No path aliases are configured; imports are relative.

## Verifying UI changes

Run the dev server and check the change in a browser. Be aware that a headless
or hidden browser pane **cannot** exercise drag-and-drop: dnd-kit's collision
detection and React's scheduler both run on `requestAnimationFrame`, which the
browser pauses in a hidden tab, so a synthesized drag never advances. Drag
behaviour needs either a visible browser or a test against the state layer
(`boardReducer` + `move()`) rather than the DOM.
