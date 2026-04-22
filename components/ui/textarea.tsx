import { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[100px] w-full rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2.5 text-sm text-[var(--ink-1)] outline-none transition placeholder:text-[var(--ink-3)] focus:border-[var(--ink-2)] focus:ring-2 focus:ring-[var(--ink-1)]/5",
        className,
      )}
      {...props}
    />
  );
}
