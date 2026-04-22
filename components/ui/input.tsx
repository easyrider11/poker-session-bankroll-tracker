import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 text-sm text-[var(--ink-1)] outline-none transition placeholder:text-[var(--ink-3)] focus:border-[var(--ink-2)] focus:ring-2 focus:ring-[var(--ink-1)]/5",
        className,
      )}
      {...props}
    />
  );
}
