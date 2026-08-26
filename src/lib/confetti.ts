import confetti from "canvas-confetti";

const LABEL_PALETTE = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fire a short celebratory burst, optionally originating from an element on
 * screen (the card that just landed in Done).
 *
 * No-ops entirely when the user prefers reduced motion — the strikethrough on
 * the card still communicates the state change without any animation.
 */
export function celebrate(element?: Element | null): void {
  if (prefersReducedMotion()) return;

  // canvas-confetti wants a normalised 0..1 origin; derive it from the card's rect.
  let origin = { x: 0.5, y: 0.6 };
  if (element) {
    const rect = element.getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }

  const shared = { origin, colors: LABEL_PALETTE, disableForReducedMotion: true };

  confetti({ ...shared, particleCount: 60, spread: 70, startVelocity: 32, scalar: 0.85 });
  confetti({ ...shared, particleCount: 25, spread: 110, startVelocity: 22, scalar: 0.65, decay: 0.92 });
}
