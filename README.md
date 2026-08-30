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

Requires Node 20.19 or newer (see `.nvmrc` — the project is developed on 24) and
a Postgres database. `docker-compose.yml` provides one.

```bash
git clone git@github.com:kyle-bush-14/kanban.git
cd kanban
npm install

cp .env.example .env
docker compose up -d      # Postgres on :5432
npm run db:migrate        # create the schema

npm run dev               # client on :5173, API on :3000
```

Then open http://localhost:5173. A fresh database starts empty; `npm run db:seed`
fills it with example tasks if you'd rather not start from nothing.

To build and run it for real:

```bash
npm run build
npm start                 # serves the API and the built client on :3000
```

`npm start` runs a single Node process that serves both `/rpc` and the built
`dist/`, so self-hosting is that process plus a Postgres instance. Migrations run
automatically on boot.

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

Your board is stored in Postgres and survives reloads. Edits save automatically:
the UI updates immediately and persistence follows in the background, so typing
and dragging never wait on the network. A badge appears in the corner if a save
fails.

Not built yet: multiple boards, card archiving, search and filtering, undo
history, authentication, and live sync between devices or browser tabs — two
tabs open on the same board will overwrite each other.

## Development

```bash
npm run dev           # client on :5173 and API on :3000 together
npm run dev:client    # just Vite
npm run dev:server    # just the API, with --watch
npm run build         # type-check and build for production
npm run typecheck     # type-check only
npm run lint          # eslint
npm run format        # rewrite files with prettier
npm run format:check  # check formatting without writing
npm test              # node's built-in test runner; no database needed

npm run db:generate   # create a migration from schema changes
npm run db:migrate    # apply migrations
npm run db:studio     # browse the data
npm run db:seed       # example tasks, only into an empty board
```

CI runs `format:check`, `lint`, `build` and `test` on every pull request to
`main`.

### Stack

React 19, TypeScript, and Vite 8, with Tailwind v4 for styling.
[Base UI](https://base-ui.com) provides the headless dialog, popover, checkbox
and number-field primitives, [@dnd-kit/react](https://next.dndkit.com) handles
dragging, plus lucide-react for icons and canvas-confetti for the celebration.

The backend is [oRPC](https://orpc.dev) over Postgres via
[Drizzle](https://orm.drizzle.team), served from a plain `node:http` server. It
runs TypeScript directly — Node strips the types, so there's no server build
step.

### Layout

```
shared/          types and zod schemas used by both sides
src/
  types.ts       re-exports the shared types, plus UI-only constants
  state/         board reducer and the sync layer
  lib/           API client, class names, dates, label styles, confetti
  components/    Board, Column, TaskCard, TaskDialog, and friends
server/
  index.ts       migrate, then listen
  app.ts         request routing: /rpc, then static files
  router.ts      the oRPC procedures
  db/            drizzle schema and queries
```

If you're making changes — or pointing a coding agent at this repo — read
[AGENTS.md](AGENTS.md) first. It covers the parts of this codebase that are
genuinely surprising, including several that have already caused bugs.

## Licence

MIT — see [LICENSE](LICENSE).
