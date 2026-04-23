import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-88 active:scale-[0.98] shadow-[0_2px_8px_rgba(30,74,57,0.25)]",
  secondary:
    "bg-[rgba(255,255,255,0.88)] text-[var(--ink-1)] ring-1 ring-[rgba(17,17,17,0.1)] hover:bg-white active:scale-[0.98]",
  ghost:
    "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-1)] active:scale-[0.98]",
  danger:
    "bg-[var(--negative-subtle)] text-[var(--negative)] ring-1 ring-[rgba(139,62,53,0.18)] hover:bg-[rgba(139,62,53,0.16)] active:scale-[0.98]",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
