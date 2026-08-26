import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

const focusRing = "focus-visible:ring-accent/70 focus-visible:ring-2 focus-visible:outline-none";

const fieldBase = cn(
  "bg-bg border-line text-ink placeholder:text-ink-faint w-full rounded-md border px-3 py-2 text-sm",
  "hover:border-line-strong transition-colors",
  focusRing,
);

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(fieldBase, className)} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(fieldBase, "resize-y leading-relaxed", className)} />;
}

type ButtonVariant = "primary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent hover:bg-accent/90 text-white",
  ghost: "text-ink-muted hover:bg-surface-hover hover:text-ink",
  danger: "text-overdue hover:bg-overdue/10",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "ghost", type = "button", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        focusRing,
        className,
      )}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-ink-muted mb-1.5 block text-xs font-semibold tracking-wide uppercase">{label}</span>
      {children}
      {hint ? <span className="text-overdue mt-1 block text-xs">{hint}</span> : null}
    </label>
  );
}
