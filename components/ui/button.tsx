import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variantClasses = {
  primary: "bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90 border border-transparent",
  secondary:
    "border border-[var(--line)] bg-[var(--surface-1)] text-[var(--ink-1)] hover:bg-[var(--surface-2)] hover:border-[var(--ink-3)]",
  ghost: "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-1)] border border-transparent",
  danger: "bg-[var(--negative)] text-white hover:opacity-90 border border-transparent",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
