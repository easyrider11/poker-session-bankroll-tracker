"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeletePlayerButton({
  playerId,
  playerName,
  redirectPath,
}: {
  playerId: number;
  playerName: string;
  redirectPath?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${playerName} from the player roster? This only works if they are not attached to any session.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/players/${playerId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not delete player.");
          return;
        }

        if (redirectPath) {
          router.push(redirectPath);
        }

        router.refresh();
      } catch {
        setError("Could not delete player.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="danger" size="sm" disabled={isPending} onClick={handleDelete}>
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {error ? <p className="text-xs font-medium text-[var(--negative)]">{error}</p> : null}
    </div>
  );
}
