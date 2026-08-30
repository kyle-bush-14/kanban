import { useCallback, useSyncExternalStore } from "react";
import { api } from "../lib/api";
import type { ColumnId, TaskPatch } from "../types";
import type { BoardAction } from "./boardReducer";

export type SyncStatus = "idle" | "saving" | "error";

/** How long to wait after the last keystroke before persisting a text edit. */
const DEBOUNCE_MS = 400;
const RETRY_DELAYS_MS = [500, 2000];

/** Scalar task fields the client may patch. Labels and checklist have their own actions. */
const PATCHABLE = ["name", "description", "dueDate", "weight"] as const;

type Job = () => Promise<unknown>;

class SyncManager {
  private status: SyncStatus = "idle";
  private listeners = new Set<() => void>();

  /** Serialises every write so rapid edits and drags can't land out of order. */
  private chain: Promise<unknown> = Promise.resolve();
  private inFlight = 0;

  private pendingPatches = new Map<string, TaskPatch>();
  private patchTimers = new Map<string, ReturnType<typeof setTimeout>>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getStatus = (): SyncStatus => this.status;

  private setStatus(next: SyncStatus) {
    if (this.status === next) return;
    this.status = next;
    for (const listener of this.listeners) listener();
  }

  /** Queue a write. Retries transient failures before surfacing an error. */
  enqueue(job: Job): void {
    this.inFlight += 1;
    this.setStatus("saving");

    this.chain = this.chain.then(async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          await job();
          break;
        } catch (error) {
          if (attempt >= RETRY_DELAYS_MS.length) {
            console.error("Failed to save change:", error);
            this.setStatus("error");
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        }
      }

      this.inFlight -= 1;
      // Only clear an error once everything queued behind it has drained.
      if (this.inFlight === 0 && this.status !== "error") this.setStatus("idle");
      if (this.inFlight === 0 && this.status === "error") this.setStatus("error");
    });
  }

  /**
   * Merge a task patch and restart its timer. Typing a description produces one
   * request after the field settles rather than one per keystroke.
   */
  patchTask(id: string, patch: TaskPatch): void {
    const merged = { ...this.pendingPatches.get(id), ...patch };
    this.pendingPatches.set(id, merged);

    clearTimeout(this.patchTimers.get(id));
    this.patchTimers.set(
      id,
      setTimeout(() => this.flushTask(id), DEBOUNCE_MS),
    );
  }

  private flushTask(id: string): void {
    const patch = this.pendingPatches.get(id);
    clearTimeout(this.patchTimers.get(id));
    this.patchTimers.delete(id);
    this.pendingPatches.delete(id);
    if (!patch || Object.keys(patch).length === 0) return;
    this.enqueue(() => api.tasks.update({ id, patch }));
  }

  /** Drop any pending edit for a task that's being deleted. */
  cancelTask(id: string): void {
    clearTimeout(this.patchTimers.get(id));
    this.patchTimers.delete(id);
    this.pendingPatches.delete(id);
  }

  /** Persist ordering from the settled column map. Called on drop, never mid-drag. */
  reorder(columns: Record<ColumnId, string[]>): void {
    this.enqueue(() => api.board.reorder({ columns }));
  }

  /** Send any outstanding debounced edits immediately. */
  flushAll(): void {
    for (const id of [...this.pendingPatches.keys()]) this.flushTask(id);
  }
}

export const sync = new SyncManager();

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(sync.subscribe, sync.getStatus, sync.getStatus);
}

function pickPatch(changes: Record<string, unknown>): TaskPatch {
  const patch: Record<string, unknown> = {};
  for (const key of PATCHABLE) {
    if (key in changes) patch[key] = changes[key];
  }
  return patch as TaskPatch;
}

/**
 * Wraps the reducer's dispatch so components keep calling `dispatch(action)`
 * unchanged while their effects get mirrored to the API.
 *
 * `drag-over` and `set-columns` are deliberately ignored: they fire many times
 * per drag. Ordering is persisted once, from Board, when the drag settles.
 */
export function useSyncedDispatch(dispatch: (action: BoardAction) => void): (action: BoardAction) => void {
  return useCallback(
    (action: BoardAction) => {
      dispatch(action);

      switch (action.type) {
        case "drag-over":
        case "set-columns":
        case "load":
          break;

        case "create-task":
          sync.enqueue(() => api.tasks.create({ id: action.id, column: action.column, name: action.name }));
          break;

        case "update-task":
          sync.patchTask(action.id, pickPatch(action.changes));
          break;

        case "delete-task":
          sync.cancelTask(action.id);
          sync.enqueue(() => api.tasks.delete({ id: action.id }));
          break;

        case "create-label":
          sync.enqueue(async () => {
            await api.labels.create({ label: action.label });
            if (action.taskId) {
              await api.labels.setOnTask({ taskId: action.taskId, labelId: action.label.id, applied: true });
            }
          });
          break;

        case "update-label":
          sync.enqueue(() => api.labels.update({ id: action.id, patch: action.changes }));
          break;

        case "toggle-task-label":
          sync.enqueue(() =>
            api.labels.setOnTask({ taskId: action.taskId, labelId: action.labelId, applied: action.applied }),
          );
          break;

        case "add-checklist-item":
          sync.enqueue(() =>
            api.checklist.add({
              taskId: action.taskId,
              item: { id: action.itemId, text: action.text, done: false },
            }),
          );
          break;

        case "update-checklist-item":
          sync.enqueue(() => api.checklist.update({ id: action.itemId, patch: action.changes }));
          break;

        case "remove-checklist-item":
          sync.enqueue(() => api.checklist.remove({ id: action.itemId }));
          break;
      }
    },
    [dispatch],
  );
}
