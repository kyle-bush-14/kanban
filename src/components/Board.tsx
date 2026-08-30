import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DragDropProvider, DragOverlay, KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { boardReducer, findColumn } from "../state/boardReducer";
import { emptyBoard } from "../state/emptyBoard";
import { sync, useSyncedDispatch } from "../state/sync";
import { api } from "../lib/api";
import type { ColumnId } from "../types";
import { COLUMNS, DONE_COLUMN } from "../types";
import { Column } from "./Column";
import { TaskCardContent } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { SyncIndicator } from "./SyncIndicator";
import { celebrate } from "../lib/confetti";

/**
 * Space picks a card up for a keyboard drag; Enter is left alone so it can open
 * the card. dnd-kit binds both by default, which makes Enter do both at once.
 */
const SENSORS = [
  PointerSensor,
  KeyboardSensor.configure({
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape"],
      end: ["Space", "Tab"],
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
    },
  }),
];

type LoadState = "loading" | "ready" | "failed";

export function Board() {
  const [state, rawDispatch] = useReducer(boardReducer, undefined, emptyBoard);
  const dispatch = useSyncedDispatch(rawDispatch);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Snapshot taken when a drag starts, so a canceled drag can be undone.
  const preDragColumnsRef = useRef(state.columns);
  // The Done column as it stood before the in-flight drag began.
  const settledDoneRef = useRef(state.columns[DONE_COLUMN]);
  // Ordering as last persisted, so we only send a reorder when it really changed.
  const persistedColumnsRef = useRef(state.columns);

  useEffect(() => {
    let cancelled = false;

    api.board
      .get()
      .then((board) => {
        if (cancelled) return;
        rawDispatch({ type: "load", state: board });
        // Loading is not a user edit: prime the refs so it neither fires
        // confetti nor writes the board straight back to the server.
        settledDoneRef.current = board.columns[DONE_COLUMN];
        persistedColumnsRef.current = board.columns;
        preDragColumnsRef.current = board.columns;
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load the board:", error);
        setLoadState("failed");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Celebrate tasks that *entered* Done, diffed against the last settled state.
   * Deriving it from board state rather than drag internals means a reorder
   * within Done never re-fires, and the check stays correct no matter how the
   * task got there.
   */
  useEffect(() => {
    if (draggingId !== null) return; // wait for the drag to settle

    const previous = settledDoneRef.current;
    const current = state.columns[DONE_COLUMN];
    if (previous === current) return;

    settledDoneRef.current = current;
    for (const id of current) {
      if (!previous.includes(id)) {
        celebrate(document.querySelector(`[data-task-id="${id}"]`));
      }
    }
  }, [draggingId, state.columns]);

  /**
   * Persist ordering once the drag settles. `drag-over` fires many times per
   * drag, so this deliberately reuses the same settled-state gate as the
   * confetti effect rather than saving from a drag handler.
   */
  useEffect(() => {
    if (loadState !== "ready" || draggingId !== null) return;
    if (persistedColumnsRef.current === state.columns) return;

    persistedColumnsRef.current = state.columns;
    sync.reorder(state.columns);
  }, [draggingId, state.columns, loadState]);

  // Don't lose an in-flight debounced edit if the tab is closed mid-typing.
  useEffect(() => {
    const flush = () => sync.flushAll();
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  const openTask = useCallback((taskId: string) => setOpenTaskId(taskId), []);
  const closeDialog = useCallback(() => setOpenTaskId(null), []);

  const addTask = useCallback(
    (column: ColumnId) => {
      const id = crypto.randomUUID();
      dispatch({ type: "create-task", id, column, name: "" });
      setOpenTaskId(id);
    },
    [dispatch],
  );

  const openTaskColumn = openTaskId ? findColumn(state.columns, openTaskId) : undefined;

  if (loadState === "loading") {
    return <BoardMessage>Loading your board…</BoardMessage>;
  }

  if (loadState === "failed") {
    return (
      <BoardMessage>
        <span className="text-overdue font-medium">Couldn&rsquo;t reach the server.</span>
        <span className="mt-1 block">Check that the API and database are running, then reload.</span>
      </BoardMessage>
    );
  }

  return (
    <DragDropProvider
      sensors={SENSORS}
      onDragStart={(event) => {
        // Reading state here is safe: no dispatch has run yet for this drag.
        preDragColumnsRef.current = state.columns;
        setDraggingId(String(event.operation.source?.id ?? "") || null);
      }}
      onDragOver={(event) => dispatch({ type: "drag-over", event })}
      onDragEnd={(event) => {
        setDraggingId(null);
        if (event.canceled) {
          dispatch({ type: "set-columns", columns: preDragColumnsRef.current });
        }
      }}
    >
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            title={column.title}
            labels={state.labels}
            tasks={state.columns[column.id].map((id) => state.tasks[id]).filter(Boolean)}
            onOpenTask={openTask}
            onAddTask={addTask}
          />
        ))}
      </div>

      <SyncIndicator />

      <DragOverlay>
        {draggingId && state.tasks[draggingId] ? (
          <div className="bg-surface-raised border-line-strong rounded-card w-72 rotate-2 border p-3 shadow-2xl">
            <TaskCardContent
              task={state.tasks[draggingId]}
              labels={state.labels}
              done={findColumn(state.columns, draggingId) === DONE_COLUMN}
            />
          </div>
        ) : null}
      </DragOverlay>

      <TaskDialog
        task={openTaskId ? state.tasks[openTaskId] : undefined}
        column={openTaskColumn}
        labels={state.labels}
        dispatch={dispatch}
        onClose={closeDialog}
      />
    </DragDropProvider>
  );
}

function BoardMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-ink-muted flex flex-1 items-center justify-center p-8 text-center text-sm">
      <p>{children}</p>
    </div>
  );
}
