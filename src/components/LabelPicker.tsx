import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import type { Label, LabelColor } from "../types";
import { LABEL_COLORS } from "../types";
import { LABEL_CHIP, LABEL_SWATCH } from "../lib/labelStyles";
import { Button, TextInput } from "./ui/controls";
import { cn } from "../lib/cn";
import { Check, Pencil } from "lucide-react";

interface Props {
  labels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onCreate: (name: string, color: LabelColor) => void;
  onRename: (labelId: string, name: string) => void;
  onRecolor: (labelId: string, color: LabelColor) => void;
}

export function LabelPicker({ labels, selectedIds, onToggle, onCreate, onRename, onRecolor }: Props) {
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<LabelColor>("blue");
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = labels.filter((label) => selectedIds.includes(label.id));

  function submitDraft() {
    const name = draftName.trim();
    if (!name) return;
    onCreate(name, draftColor);
    setDraftName("");
  }

  return (
    <div>
      <span className="text-ink-muted mb-1.5 block text-xs font-semibold tracking-wide uppercase">Labels</span>

      <Popover.Root>
        <Popover.Trigger
          className={cn(
            "border-line hover:border-line-strong flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors",
            "focus-visible:ring-accent/70 focus-visible:ring-2 focus-visible:outline-none",
          )}
        >
          {selected.length === 0 ? (
            <span className="text-ink-faint px-1 text-sm">Add labels…</span>
          ) : (
            selected.map((label) => (
              <span
                key={label.id}
                className={cn("rounded border px-1.5 py-0.5 text-xs font-medium", LABEL_CHIP[label.color])}
              >
                {label.name}
              </span>
            ))
          )}
        </Popover.Trigger>

        <Popover.Portal>
          {/* Above the dialog's own z-50, since the picker lives inside it. */}
          <Popover.Positioner sideOffset={6} align="start" className="z-60">
            <Popover.Popup className="bg-surface-raised border-line w-72 rounded-lg border p-3 shadow-xl outline-none">
              <p className="text-ink-muted mb-2 text-xs font-semibold tracking-wide uppercase">Board labels</p>

              <ul className="mb-3 flex flex-col gap-1">
                {labels.map((label) => {
                  const isSelected = selectedIds.includes(label.id);
                  const isEditing = editingId === label.id;

                  return (
                    <li key={label.id} className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex flex-1 flex-col gap-1.5">
                          <TextInput
                            autoFocus
                            value={label.name}
                            onChange={(event) => onRename(label.id, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === "Escape") setEditingId(null);
                            }}
                            className="py-1"
                          />
                          <ColorSwatches value={label.color} onChange={(color) => onRecolor(label.id, color)} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggle(label.id)}
                          className={cn(
                            "hover:bg-surface-hover flex flex-1 items-center gap-2 rounded px-1.5 py-1 text-left text-sm transition-colors",
                          )}
                        >
                          <span className={cn("size-3 shrink-0 rounded-sm", LABEL_SWATCH[label.color])} />
                          <span className="text-ink flex-1 truncate">{label.name}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : label.id)}
                        aria-label={isEditing ? `Done editing ${label.name}` : `Edit ${label.name}`}
                        className="text-ink-faint hover:text-ink shrink-0 self-start rounded p-1"
                      >
                        {isEditing ? <Check size={14} /> : <Pencil size={14} />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-line border-t pt-2.5">
                <p className="text-ink-muted mb-1.5 text-xs font-semibold tracking-wide uppercase">New label</p>
                <TextInput
                  value={draftName}
                  placeholder="Label name"
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitDraft();
                    }
                  }}
                  className="mb-2 py-1"
                />
                <div className="flex items-center justify-between">
                  <ColorSwatches value={draftColor} onChange={setDraftColor} />
                  <Button variant="primary" onClick={submitDraft} disabled={!draftName.trim()} className="py-1">
                    Create
                  </Button>
                </div>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function ColorSwatches({ value, onChange }: { value: LabelColor; onChange: (color: LabelColor) => void }) {
  return (
    <div className="flex gap-1">
      {LABEL_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={color}
          aria-pressed={value === color}
          className={cn(
            "size-5 rounded transition",
            LABEL_SWATCH[color],
            value === color
              ? "ring-ink ring-offset-surface-raised ring-2 ring-offset-2"
              : "opacity-60 hover:opacity-100",
          )}
        />
      ))}
    </div>
  );
}
