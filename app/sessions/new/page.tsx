import { NewSessionBuilder } from "@/components/sessions/new-session-builder";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { serializePlayer } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="New session"
        description="Set the roster and each player&apos;s initial buy-in here. Once the session opens, use the live tracker to record rebuys and current chips."
      />
      <NewSessionBuilder players={players.map(serializePlayer)} />
    </div>
  );
}
