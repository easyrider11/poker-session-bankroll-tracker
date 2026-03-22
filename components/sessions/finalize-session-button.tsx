"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function FinalizeSessionButton({
  sessionId,
  finalizedAt,
}: {
  sessionId: number;
  finalizedAt: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (finalizedAt) {
    return (
      <div className="text-right">
        <Button disabled>Session finalized</Button>
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

    startTransition(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/finalize`, {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not finalize session.");
          return;
        }

        router.refresh();
      } catch {
        setError("Could not finalize session.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleFinalize} disabled={isPending}>
        {isPending ? "Finalizing..." : "Finalize session"}
      </Button>
      {error ? <p className="text-sm font-medium text-[var(--negative)]">{error}</p> : null}
    </div>
  );
}
