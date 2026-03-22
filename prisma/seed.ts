import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedPlayers = [
  { name: "Alex Rivera", nickname: "Ace" },
  { name: "Jordan Lee", nickname: "Stacks" },
  { name: "Chris Parker", nickname: "River Rat" },
  { name: "Taylor Brooks", nickname: "Tank" },
  { name: "Morgan Ellis", nickname: "Button" },
  { name: "Sam Patel", nickname: "Shorty" },
];

async function main() {
  const existingPlayers = await prisma.player.count();

  if (existingPlayers > 0) {
    console.log("Seed skipped: players already exist.");
    return;
  }

  await prisma.player.createMany({
    data: seedPlayers,
  });

  console.log(`Seeded ${seedPlayers.length} players.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
