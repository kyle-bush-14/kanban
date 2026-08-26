import { useState } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import type { ChecklistItem } from "../types";
import { Button, TextInput } from "./ui/controls";
import { cn } from "../lib/cn";
import { Check, X } from "lucide-react";

interface Props {
  items: ChecklistItem[];
  onAdd: (text: string) => void;
  onToggle: (itemId: string, done: boolean) => void;
  onRename: (itemId: string, text: string) => void;
  onRemove: (itemId: string) => void;
}

export function ChecklistEditor({ items, onAdd, onToggle, onRename, onRemove }: Props) {
  const [draft, setDraft] = useState("");

  const total = items.length;
  const completed = items.filter((item) => item.done).length;

  function submitDraft() {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-ink-muted text-xs font-semibold tracking-wide uppercase">Checklist</span>
        {total > 0 && (
          <span className="text-ink-faint text-xs">
            {completed} of {total} done
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="bg-surface-hover mb-2 h-1 overflow-hidden rounded-full">
          <div
            className="bg-label-green h-full rounded-full transition-[width] duration-300"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      <ul className="mb-2 flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.id} className="group hover:bg-surface-hover flex items-center gap-2 rounded-md px-1.5 py-1">
            <Checkbox.Root
              checked={item.done}
              onCheckedChange={(checked) => onToggle(item.id, checked === true)}
              aria-label={item.text}
              className={cn(
                "border-line-strong flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                "data-checked:border-label-green data-checked:bg-label-green",
                "focus-visible:ring-accent/70 focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              <Checkbox.Indicator className="flex text-black">
                <Check size={14} />
              </Checkbox.Indicator>
            </Checkbox.Root>

            <input
              value={item.text}
              onChange={(event) => onRename(item.id, event.target.value)}
              className={cn(
                "text-ink min-w-0 flex-1 bg-transparent text-sm focus:outline-none",
                item.done && "text-ink-faint line-through",
              )}
            />

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove "${item.text}"`}
              className="text-ink-faint hover:text-overdue shrink-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <TextInput
          value={draft}
          placeholder="Add a sub-task…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitDraft();
            }
          }}
        />
        <Button variant="primary" onClick={submitDraft} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
