import { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-3xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink-1)] outline-none transition placeholder:text-[var(--ink-3)] focus:border-[var(--ink-1)]",
        className,
      )}
      {...props}
    />
  );
}
