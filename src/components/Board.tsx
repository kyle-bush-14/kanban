import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DragDropProvider, DragOverlay, KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { boardReducer, findColumn } from "../state/boardReducer";
import { createSeedBoard } from "../state/seed";
import type { ColumnId } from "../types";
import { COLUMNS, DONE_COLUMN } from "../types";
import { Column } from "./Column";
import { TaskCardContent } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
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

export function Board() {
  const [state, dispatch] = useReducer(boardReducer, undefined, createSeedBoard);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Snapshot taken when a drag starts, so a canceled drag can be undone.
  const preDragColumnsRef = useRef(state.columns);
  // The Done column as it stood before the in-flight drag began.
  const settledDoneRef = useRef(state.columns[DONE_COLUMN]);

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

  const openTask = useCallback((taskId: string) => setOpenTaskId(taskId), []);
  const closeDialog = useCallback(() => setOpenTaskId(null), []);

  const addTask = useCallback((column: ColumnId) => {
    const id = crypto.randomUUID();
    dispatch({ type: "create-task", id, column, name: "" });
    setOpenTaskId(id);
  }, []);

  const openTaskColumn = openTaskId ? findColumn(state.columns, openTaskId) : undefined;

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
