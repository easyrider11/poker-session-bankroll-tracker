-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lifetime_buyin" INTEGER NOT NULL DEFAULT 0,
    "lifetime_cashout" INTEGER NOT NULL DEFAULT 0,
    "lifetime_profit" INTEGER NOT NULL DEFAULT 0,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poker_sessions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "finalized_at" TIMESTAMP(3),

    CONSTRAINT "poker_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_players" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "total_buyin" INTEGER NOT NULL DEFAULT 0,
    "total_cashout" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyin_records" (
    "id" SERIAL NOT NULL,
    "session_player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyin_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex
CREATE INDEX "players_nickname_idx" ON "players"("nickname");

-- CreateIndex
CREATE INDEX "poker_sessions_session_date_idx" ON "poker_sessions"("session_date");

-- CreateIndex
CREATE UNIQUE INDEX "session_players_session_id_player_id_key" ON "session_players"("session_id", "player_id");

-- CreateIndex
CREATE INDEX "session_players_player_id_idx" ON "session_players"("player_id");

-- CreateIndex
CREATE INDEX "session_players_session_id_idx" ON "session_players"("session_id");

-- CreateIndex
CREATE INDEX "buyin_records_session_player_id_idx" ON "buyin_records"("session_player_id");

-- AddForeignKey
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "poker_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyin_records" ADD CONSTRAINT "buyin_records_session_player_id_fkey" FOREIGN KEY ("session_player_id") REFERENCES "session_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
