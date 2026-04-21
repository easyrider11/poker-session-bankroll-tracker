# Poker Ledger iOS Design

## Assumptions

- The user asked for no interruptions, so product decisions are made here without a review gate.
- The iOS app is local-first and stores data on-device.
- The app targets iOS 17+ and uses SwiftUI plus Observation.
- A session can only be finalized when the table net is exactly zero in cents.
- Historical players, sessions, and lifetime bankroll stats are persisted across launches.

## Product Goal

Build a native iPhone poker bankroll tracker that lets the host:

1. Create a new cash-game session.
2. Reuse common or historical players.
3. Assign each player's opening buy-in.
4. Record cash-in and cash-out events throughout the session.
5. Finalize only when every player's profit/loss sums to zero across the table.
6. Review historical sessions and player lifetime results later.

## Experience Direction

The visual language is minimal and tactile:

- Primary background: deep poker-felt green.
- Surfaces: black, white, and desaturated green cards.
- Typography: bold numeric hierarchy, quieter supporting copy.
- Interactions: chip-like amount pills, rounded table-inspired cards, compact ledger rows.
- Primary focus: a host should be able to run a table one-handed on an iPhone.

## Information Architecture

### Home

- KPI cards for total players, total sessions, lifetime tracked buy-ins, and active draft status.
- Quick actions to start a session, resume an active draft, or open history.
- Recent sessions strip for fast re-entry.

### Sessions

- Segmented list for Draft and Finalized sessions.
- Search by title, notes, or player names.
- New session button pinned to the top.

### Session Builder

- Step 1: session title, date, notes.
- Step 2: choose from common players or add a new one inline.
- Step 3: assign opening buy-ins via shared amount or per-player custom amount.
- Submit creates a draft session and opens the live tracker.

### Live Session Tracker

- Sticky table status card showing total cash-in, total cash-out, table delta, and finalize readiness.
- One row per player with:
  - name and quick stats
  - total buy-in
  - total cash-out
  - current profit/loss
  - quick cash-in buttons
  - quick cash-out buttons
  - manual amount entry
- Event timeline grouped by player for auditability.
- Finalize CTA disabled until net delta is zero and at least one player exists.

### Session Detail / History

- Frozen settlement snapshot.
- Per-player summary and event log.
- Session metadata and notes.

### Players

- Searchable player roster.
- Lifetime buy-in, cash-out, profit, and session count.
- Reuse ranking based on recency and session count.

## Data Model

### PlayerProfile

- `id: UUID`
- `name: String`
- `nickname: String?`
- `createdAt: Date`
- `updatedAt: Date`
- `lifetimeBuyInCents: Int`
- `lifetimeCashOutCents: Int`
- `lifetimeProfitCents: Int`
- `sessionCount: Int`

### SessionLedgerEvent

- `id: UUID`
- `playerID: UUID`
- `type: cashIn | cashOut`
- `amountCents: Int`
- `createdAt: Date`
- `note: String?`
- `origin: openingBuyIn | rebuy | cashOut | correction`

### SessionSeat

- `id: UUID`
- `playerID: UUID`
- `joinedAt: Date`
- `events: [SessionLedgerEvent]`

Computed values:

- `totalCashIn`
- `totalCashOut`
- `profit = totalCashOut - totalCashIn`

### PokerSessionRecord

- `id: UUID`
- `title: String`
- `sessionDate: Date`
- `notes: String`
- `status: draft | finalized`
- `createdAt: Date`
- `updatedAt: Date`
- `finalizedAt: Date?`
- `seats: [SessionSeat]`

### AppArchive

- `players: [PlayerProfile]`
- `sessions: [PokerSessionRecord]`

## Architecture

### Core Package

`PokerLedgerCore` is a Swift package containing:

- money parsing and formatting
- session math
- validation rules
- archive persistence
- seed/demo data

This package is testable from the command line with `swift test`.

### iOS App Layer

The native app target owns:

- SwiftUI navigation
- reusable design system
- screen view models using Observation
- app lifecycle and environment injection

### Persistence

- JSON archive saved into `Application Support`.
- Writes happen after each user mutation through a repository layer.
- The design intentionally keeps storage simple and local-first for a dependable MVP.

## Key Rules

- Amounts are stored as integer cents.
- Duplicate players cannot be seated twice in one session.
- Cash-in and cash-out events must be positive values.
- Finalization is blocked when:
  - the session has no players
  - any invalid amount exists
  - table delta is not zero
- Finalization updates player lifetime totals exactly once.
- Finalized sessions are read-only.

## Testing Strategy

- Unit tests in `PokerLedgerCore` cover money parsing, ledger aggregation, zero-sum enforcement, and lifetime stat updates.
- Persistence tests verify archive save/load round-trips.
- The generated Xcode project includes an iOS app target for simulator/device runs once Xcode is available.

## Deployment Shape

- Generate the iOS project with XcodeGen.
- Open the generated `PokerLedger.xcodeproj` in Xcode.
- Set signing team and bundle identifier.
- Run on simulator or device.
- Archive from Xcode for TestFlight/App Store distribution when full Xcode and Apple credentials are available.
