import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink-1)] outline-none transition placeholder:text-[var(--ink-3)] focus:border-[var(--ink-1)]",
        className,
      )}
      {...props}
    />
  );
}
