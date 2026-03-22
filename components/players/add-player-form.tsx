"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddPlayerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/players", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            nickname,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not create player.");
          return;
        }

        setName("");
        setNickname("");
        setSuccess("Player added.");
        router.refresh();
      } catch {
        setError("Could not create player.");
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--ink-1)]" htmlFor="player-name">
          Player name
        </label>
        <Input
          id="player-name"
          placeholder="Alex Rivera"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--ink-1)]" htmlFor="player-nickname">
          Nickname
        </label>
        <Input
          id="player-nickname"
          placeholder="Optional"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm font-medium text-[var(--negative)]">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-[var(--positive)]">{success}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Adding player..." : "Add player"}
      </Button>
    </form>
  );
}
