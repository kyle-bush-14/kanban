import type { FC } from "react";
import { Board } from "./components/Board";

const App: FC = () => {
  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex shrink-0 items-center gap-3 border-b px-5 py-3">
        <div className="bg-accent grid size-7 place-items-center rounded-md">
          <svg viewBox="0 0 16 16" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M3 3h3v10H3zM6.5 3h3v6h-3zM10 3h3v8h-3z" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-ink text-sm leading-tight font-semibold">Kanban</h1>
          <p className="text-ink-faint text-xs leading-tight">Personal task board</p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <Board />
      </main>
    </div>
  );
};

export default App;
