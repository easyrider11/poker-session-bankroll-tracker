"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeleteSessionButton({
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
    return null;
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this draft session? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not delete session.");
          return;
        }

        router.push("/sessions");
        router.refresh();
      } catch {
        setError("Could not delete session.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="danger" onClick={handleDelete} disabled={isPending}>
        {isPending ? "Deleting..." : "Delete draft"}
      </Button>
      {error ? <p className="text-sm font-medium text-[var(--negative)]">{error}</p> : null}
    </div>
  );
}
