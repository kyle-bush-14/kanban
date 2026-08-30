# Kanban

A self-hosted personal task board. Four columns, drag cards between them, click
a card to edit it. Finishing something is supposed to feel good, so dropping a
card into **Done** sets off a confetti burst and crosses the task off.

Built to be small and to run on your own machine — no accounts, no telemetry,
no third-party services.

## Features

- **Four columns** — Backlog, To Do, In Progress, Done
- **Drag and drop** between and within columns, with a keyboard path as well
- **Rich cards** showing whatever you've filled in: weight, due date, checklist
  progress, and colour-coded labels. Leave a field blank and its badge simply
  doesn't appear
- **Click-to-edit details** — name, description, due date, weight, a checklist
  of sub-tasks, and labels
- **Board-level labels** you create, rename, and recolour once, then apply to
  any card
- **Due dates that tell you something** — overdue and due-soon dates are
  colour-coded, and shown as "Today", "Tomorrow", "3d ago" rather than raw dates
- **Confetti on completion**, plus a strikethrough on the card. Respects
  `prefers-reduced-motion`: the strikethrough still happens, the animation
  doesn't
- **Dark theme**, tuned as a single palette

## Getting started

Requires Node 20.19 or newer (see `.nvmrc` — the project is developed on 24).

```bash
git clone git@github.com:kyle-bush-14/kanban.git
cd kanban
npm install
npm run dev
```

Then open http://localhost:5173.

To build and serve the production bundle:

```bash
npm run build
npm run preview
```

`npm run build` emits a static `dist/` directory. It's a plain SPA with no
server component, so you can host it behind any static file server — nginx,
Caddy, a container, or a folder on a NAS.

## Using the board

| Action                 | How                                                      |
| ---------------------- | -------------------------------------------------------- |
| Open a card            | Click it, or focus it and press <kbd>Enter</kbd>         |
| Move a card            | Drag it, or focus it and press <kbd>Space</kbd>          |
| Move with the keyboard | <kbd>Space</kbd>, then arrow keys, then <kbd>Space</kbd> |
| Cancel a drag          | <kbd>Esc</kbd>                                           |
| Add a card             | The **+** in any column header                           |
| Edit a card            | Changes save as you type — no save button                |
| Delete a card          | **Delete task**, at the bottom of the card dialog        |

Everything on a card except the name is optional. A card with just a name shows
just a name.

## Current status

**Nothing is persisted yet.** The board loads from a seed set of example tasks
and resets when you reload the page. State is already kept as one serializable
object specifically so a storage layer can be added without reworking the UI —
that's the next piece of work.

Also not built yet: multiple boards, card archiving, search and filtering, and
any kind of sync between devices.

## Development

```bash
npm run dev           # dev server on :5173
npm run build         # type-check and build for production
npm run typecheck     # type-check only
npm run lint          # eslint
npm run format        # rewrite files with prettier
npm run format:check  # check formatting without writing
```

CI runs `format:check`, `lint`, and `build` on every pull request to `main`.
There is no test suite yet.

### Stack

React 19, TypeScript, and Vite 8, with Tailwind v4 for styling.
[Base UI](https://base-ui.com) provides the headless dialog, popover, checkbox
and number-field primitives, [@dnd-kit/react](https://next.dndkit.com) handles
dragging, plus lucide-react for icons and canvas-confetti for the celebration.

### Layout

```
src/
  types.ts       shared types — columns, tasks, labels
  state/         board reducer and the seed board
  lib/           class names, date formatting, label styles, confetti
  components/    Board, Column, TaskCard, TaskDialog, and friends
```

If you're making changes — or pointing a coding agent at this repo — read
[AGENTS.md](AGENTS.md) first. It covers the parts of this codebase that are
genuinely surprising, including several that have already caused bugs.

## Licence

MIT — see [LICENSE](LICENSE).
