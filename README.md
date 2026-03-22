# Poker Session Bankroll Tracker

Minimal MVP for tracking Texas Hold'em cash game sessions, per-player buy-ins, final cash-outs, settlement results, and lifetime bankroll stats.

The project now supports two runtime tracks:

- local development with SQLite
- production deployment with PostgreSQL and installable PWA metadata

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- SQLite for local development
- PostgreSQL-ready production schema for cloud deployment
- REST-style App Router route handlers

The Prisma schema uses table and column mappings that match the requested relational design (`players`, `poker_sessions`, `session_players`, `buyin_records`) while keeping TypeScript model names ergonomic.

## Agent Plan

### Master Agent

- Defined the module boundaries and shared contracts.
- Integrated the backend services, route handlers, and UI pages into one runnable app.
- Verified the app locally with Prisma, lint, and production build commands.

### Agent A: Backend / Database

- Built the Prisma schema and migration-ready relational model.
- Implemented seed data, validation, serializers, and session service logic.
- Added transactional session finalization so lifetime player totals update atomically.

### Agent B: Frontend / UI

- Built the dashboard, players page, player detail page, new session builder, and settlement view.
- Added real-time buy-in, cash-out, and profit calculations in the session builder.
- Kept the UI table-centric, minimal, and desktop-first with basic mobile overflow support.

### Agent C: Docs / Developer Experience

- Added `.env.example`.
- Documented setup, schema, API endpoints, assumptions, and next improvements here.

## File Structure

```text
app/
  api/
  players/
  sessions/
  layout.tsx
  page.tsx
components/
  players/
  sessions/
  ui/
lib/
prisma/
  schema.prisma
  seed.ts
.env.example
README.md
```

## Core Features

- Player management with persistent records and lifetime bankroll totals
- Searchable player roster
- New session builder with:
  - reusable player selection
  - multiple buy-ins per player
  - one final cash-out per player
  - live total buy-in / cash-out / profit calculations
- Settlement table sortable by profit/loss
- Transactional session finalization that updates lifetime stats
- Home dashboard with recent sessions and summary stats
- Installable PWA metadata and service worker registration for app-like usage

## Data Model

Amounts are stored as integer cents for correctness and portability.

- `players`
  - `id`
  - `name`
  - `nickname`
  - `created_at`
  - `updated_at`
  - `lifetime_buyin`
  - `lifetime_cashout`
  - `lifetime_profit`
  - `total_sessions`
- `poker_sessions`
  - `id`
  - `title`
  - `session_date`
  - `notes`
  - `created_at`
  - `updated_at`
  - `finalized_at`
- `session_players`
  - `id`
  - `session_id`
  - `player_id`
  - `total_buyin`
  - `total_cashout`
  - `profit`
  - `created_at`
  - `updated_at`
- `buyin_records`
  - `id`
  - `session_player_id`
  - `amount`
  - `created_at`

Key rules:

- A player can appear in many sessions.
- A session can contain many players.
- A player can have many buy-ins within one session.
- The same player cannot be added twice to one session.
- Profit is always `total_cashout - total_buyin`.
- Finalization updates player lifetime stats inside a transaction.

## API Summary

### Players

- `GET /api/players`
- `POST /api/players`
- `GET /api/players/[id]`
- `GET /api/players/search?q=`

### Sessions

- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/[id]`
- `POST /api/sessions/[id]/finalize`

### Session Players / Buy-ins

- `POST /api/sessions/[id]/players`
- `POST /api/session-players/[id]/buyins`
- `PATCH /api/session-players/[id]/cashout`

All mutation endpoints validate request payloads with Zod.

## Local Setup

Local development keeps the current fast SQLite workflow.

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. Create the database and run the initial migration:

```bash
npm run prisma:migrate -- --name init
```

5. Seed players:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Production Deployment

The app is now structured so local work can stay on SQLite while deployment targets PostgreSQL.

### Recommended Shape

- Hosting: Vercel
- App build: `npm run build:prod`
- Database: managed PostgreSQL
- Installability: PWA manifest + service worker + Apple web app metadata

### Production Environment Variables

Set these in your hosting platform:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Prisma Production Files

- Local SQLite schema: [prisma/schema.prisma](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/prisma/schema.prisma)
- Production PostgreSQL schema: [prisma/postgres/schema.prisma](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/prisma/postgres/schema.prisma)
- Production PostgreSQL initial migration: [migration.sql](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/prisma/postgres/migrations/20260321125000_init/migration.sql)

### Production Commands

Generate the PostgreSQL Prisma client:

```bash
npm run prisma:generate:prod
```

Apply production migrations:

```bash
npm run prisma:migrate:prod
```

Build using the PostgreSQL schema:

```bash
npm run build:prod
```

If you deploy on Vercel, the repo includes [vercel.json](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/vercel.json) so the build command already uses `npm run build:prod`.

## Multi-Device Usage

To use the tracker across phone, iPad, and desktop with shared history:

1. Deploy the app publicly.
2. Point `DATABASE_URL` at a cloud PostgreSQL database.
3. Run the PostgreSQL migration once.
4. Open the deployed URL on every device.

All future session and player history will then live in the same cloud database.

## PWA / Installable Web App

The app now includes:

- manifest route: [app/manifest.ts](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/app/manifest.ts)
- generated app icon: [app/icon.tsx](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/app/icon.tsx)
- generated Apple icon: [app/apple-icon.tsx](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/app/apple-icon.tsx)
- service worker registration: [pwa-register.tsx](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/components/pwa-register.tsx)
- service worker file: [sw.js](/Users/PC/Documents/GitHub/poker-session-bankroll-tracker/public/sw.js)

This gives the app the metadata and registration hooks needed for an app-like install experience once it is served over HTTPS.

## Assumptions

- SQLite is the default database for this MVP because it lowers local setup friction.
- Currency is displayed in USD.
- Session creation supports saving a full session draft in one API call, even though the more granular session-player endpoints also exist.
- Lifetime stats update only when a session is finalized.

## Notes on Data Migration

Historical data already stored in your local SQLite file is not automatically copied into PostgreSQL yet.

What is ready now:

- the production PostgreSQL Prisma schema
- the initial PostgreSQL migration
- the production build path
- the installable web app metadata

If you want to migrate existing local data instead of starting fresh in the cloud, the next step is to add a one-time SQLite-to-PostgreSQL transfer script.

## Future Improvements

- Edit existing draft sessions after creation
- Delete or archive sessions
- Session filters and reporting
- Export settlement history to CSV
- Lightweight authentication for private home games
