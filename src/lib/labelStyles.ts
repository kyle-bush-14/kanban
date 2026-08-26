import type { LabelColor } from "../types";

/**
 * Full class strings per colour, not template literals — Tailwind scans source
 * text, so `bg-label-${color}` would never be generated.
 */
export const LABEL_CHIP: Record<LabelColor, string> = {
  red: "bg-label-red/20 text-label-red border-label-red/40",
  orange: "bg-label-orange/20 text-label-orange border-label-orange/40",
  yellow: "bg-label-yellow/20 text-label-yellow border-label-yellow/40",
  green: "bg-label-green/20 text-label-green border-label-green/40",
  blue: "bg-label-blue/20 text-label-blue border-label-blue/40",
  purple: "bg-label-purple/20 text-label-purple border-label-purple/40",
};

export const LABEL_SWATCH: Record<LabelColor, string> = {
  red: "bg-label-red",
  orange: "bg-label-orange",
  yellow: "bg-label-yellow",
  green: "bg-label-green",
  blue: "bg-label-blue",
  purple: "bg-label-purple",
};
