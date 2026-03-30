import { NewSessionBuilder } from "@/components/sessions/new-session-builder";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { serializeSessionBuilderPlayer } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      nickname: true,
      lifetimeProfit: true,
      totalSessions: true,
    },
    orderBy: [{ name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="New session"
        description="Move through a simple setup flow: session details, seated players, opening buy-ins, then straight into the live tracker."
      />
      <NewSessionBuilder players={players.map(serializeSessionBuilderPlayer)} />
    </div>
  );
}
