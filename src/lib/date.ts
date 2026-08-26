/** Midnight today, so comparisons ignore the time of day. */
function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/** Parse `yyyy-mm-dd` as a *local* date — `new Date(iso)` would treat it as UTC and shift the day. */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysUntil(iso: string): number {
  const diff = parseIsoDate(iso).getTime() - startOfToday().getTime();
  return Math.round(diff / 86_400_000);
}

export type DueStatus = "overdue" | "due-soon" | "upcoming";

export function dueStatus(iso: string): DueStatus {
  const days = daysUntil(iso);
  if (days < 0) return "overdue";
  if (days <= 3) return "due-soon";
  return "upcoming";
}

/** Short, human labels for the card badge: "Today", "Tomorrow", "3d ago", "Mar 14". */
export function formatDueDate(iso: string): string {
  const days = daysUntil(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days <= 6) return `${days}d`;

  const date = parseIsoDate(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}
