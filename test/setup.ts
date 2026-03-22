import { execFileSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, beforeEach } from "vitest";

process.env.DATABASE_URL = "file:./test.db";

const prismaBinary = path.resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

closeSync(openSync(path.resolve(process.cwd(), "prisma", "test.db"), "a"));

execFileSync(prismaBinary, ["db", "push", "--force-reset", "--skip-generate"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "pipe",
});

const { prisma } = await import("@/lib/prisma");

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.buyinRecord.deleteMany();
  await prisma.sessionPlayer.deleteMany();
  await prisma.pokerSession.deleteMany();
  await prisma.player.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
