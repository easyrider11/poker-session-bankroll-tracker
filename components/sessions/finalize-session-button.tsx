"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { SerializedSession } from "@/lib/serializers";
import { cn } from "@/lib/utils";

export function FinalizeSessionButton({
  sessionId,
  finalizedAt,
  className,
  buttonClassName,
  onPendingChange,
  onFinalized,
}: {
  sessionId: number;
  finalizedAt: string | null;
  className?: string;
  buttonClassName?: string;
  onPendingChange?: (isPending: boolean) => void;
  onFinalized?: (session: SerializedSession) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (finalizedAt) {
    return (
      <div className={cn("text-right", className)}>
        <Button disabled className={buttonClassName}>
          Session finalized
        </Button>
      </div>
    );
  }

  function handleFinalize() {
    const confirmed = window.confirm(
      "Finalize this session and update all lifetime player stats?",
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    onPendingChange?.(true);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/finalize`, {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not finalize session.");
          onPendingChange?.(false);
          return;
        }

        onFinalized?.(data.session as SerializedSession);
        router.refresh();
      } catch {
        setError("Could not finalize session.");
        onPendingChange?.(false);
      }
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button onClick={handleFinalize} disabled={isPending} className={buttonClassName}>
        {isPending ? "Finalizing..." : "Finalize session"}
      </Button>
      {error ? <p className="text-sm font-medium text-[var(--negative)]">{error}</p> : null}
    </div>
  );
}
