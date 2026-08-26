import type { FC } from "react";
import { Board } from "./components/Board";
import { SquareKanban } from "lucide-react";

const App: FC = () => {
  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex shrink-0 items-center gap-3 border-b px-5 py-3">
        <div className="bg-accent grid size-7 place-items-center rounded-md">
          <SquareKanban />
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
