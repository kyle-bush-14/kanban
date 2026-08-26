type ClassValue = string | false | null | undefined;

/** Minimal class joiner — enough for this app without pulling in clsx. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
