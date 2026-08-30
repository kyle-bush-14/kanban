import { COLUMN_IDS } from "../types";
import type { BoardState, ColumnId } from "../types";

/** A board with no tasks. Used before the server responds, and for a fresh install. */
export function emptyBoard(): BoardState {
  return {
    tasks: {},
    columns: Object.fromEntries(COLUMN_IDS.map((id) => [id, [] as string[]])) as Record<ColumnId, string[]>,
    labels: [],
  };
}
