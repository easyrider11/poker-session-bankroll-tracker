import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variantClasses = {
  primary: "bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90",
  secondary:
    "border border-[var(--line)] bg-[var(--surface-1)] text-[var(--ink-1)] hover:border-[var(--ink-1)]",
  ghost: "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-1)]",
  danger: "bg-[var(--negative)] text-[var(--on-accent)] hover:opacity-90",
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
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
        "inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
