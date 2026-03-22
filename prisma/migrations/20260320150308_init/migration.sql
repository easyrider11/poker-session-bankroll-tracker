-- CreateTable
CREATE TABLE "players" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "lifetime_buyin" INTEGER NOT NULL DEFAULT 0,
    "lifetime_cashout" INTEGER NOT NULL DEFAULT 0,
    "lifetime_profit" INTEGER NOT NULL DEFAULT 0,
    "total_sessions" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "poker_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "session_date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "finalized_at" DATETIME
);

-- CreateTable
CREATE TABLE "session_players" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "total_buyin" INTEGER NOT NULL DEFAULT 0,
    "total_cashout" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "session_players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "poker_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "buyin_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buyin_records_session_player_id_fkey" FOREIGN KEY ("session_player_id") REFERENCES "session_players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex
CREATE INDEX "players_nickname_idx" ON "players"("nickname");

-- CreateIndex
CREATE INDEX "poker_sessions_session_date_idx" ON "poker_sessions"("session_date");

-- CreateIndex
CREATE INDEX "session_players_player_id_idx" ON "session_players"("player_id");

-- CreateIndex
CREATE INDEX "session_players_session_id_idx" ON "session_players"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_players_session_id_player_id_key" ON "session_players"("session_id", "player_id");

-- CreateIndex
CREATE INDEX "buyin_records_session_player_id_idx" ON "buyin_records"("session_player_id");
