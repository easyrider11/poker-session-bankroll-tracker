# Poker Ledger iOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native SwiftUI iPhone app for poker session bookkeeping with reusable players, live cash-in/cash-out tracking, zero-sum session validation, and historical records.

**Architecture:** Keep business rules in a standalone Swift package named `PokerLedgerCore`, then compose a SwiftUI iOS app around it using Observation, a repository-backed app model, and XcodeGen for project generation.

**Tech Stack:** Swift 5.10, SwiftUI, Observation, Foundation, XcodeGen, local JSON persistence

---

### Task 1: Core Package Skeleton

**Files:**
- Create: `ios/PokerLedgerCore/Package.swift`
- Create: `ios/PokerLedgerCore/Sources/PokerLedgerCore/`
- Create: `ios/PokerLedgerCore/Tests/PokerLedgerCoreTests/`

- [ ] Write failing tests for money parsing and session math.
- [ ] Run `swift test` and confirm the package fails because sources do not exist yet.
- [ ] Implement minimal money helpers and ledger models.
- [ ] Run `swift test` again until the new package is green.

### Task 2: Session Workflow Rules

**Files:**
- Create: `ios/PokerLedgerCore/Sources/PokerLedgerCore/SessionWorkflow.swift`
- Create: `ios/PokerLedgerCore/Tests/PokerLedgerCoreTests/SessionWorkflowTests.swift`

- [ ] Write failing tests for duplicate-player rejection, event appending, zero-sum checks, and lifetime stat application.
- [ ] Run the focused tests to verify red.
- [ ] Implement the minimal workflow service to satisfy those rules.
- [ ] Re-run the focused tests and then the full package suite.

### Task 3: Local Persistence

**Files:**
- Create: `ios/PokerLedgerCore/Sources/PokerLedgerCore/ArchiveStore.swift`
- Create: `ios/PokerLedgerCore/Sources/PokerLedgerCore/SampleData.swift`
- Create: `ios/PokerLedgerCore/Tests/PokerLedgerCoreTests/ArchiveStoreTests.swift`

- [ ] Write failing persistence round-trip tests using a temporary directory.
- [ ] Run the persistence tests to verify red.
- [ ] Implement JSON archive loading, saving, and sample bootstrap helpers.
- [ ] Re-run all core package tests.

### Task 4: SwiftUI App Shell

**Files:**
- Create: `ios/project.yml`
- Create: `ios/PokerLedger/`
- Create: `ios/PokerLedger/App/`
- Create: `ios/PokerLedger/DesignSystem/`
- Create: `ios/PokerLedger/Features/`

- [ ] Generate the iOS project structure with XcodeGen configuration.
- [ ] Implement the app entry point, shared app model, navigation shell, and theme tokens.
- [ ] Add dashboard, sessions list, and players list shells wired to sample/local data.

### Task 5: Session Builder and Live Tracker UI

**Files:**
- Create or modify files under `ios/PokerLedger/Features/SessionBuilder/`
- Create or modify files under `ios/PokerLedger/Features/SessionDetail/`

- [ ] Build the session creation flow with reusable player selection and opening buy-ins.
- [ ] Build the live tracker with quick cash-in/out controls, manual entry, and table delta banner.
- [ ] Block finalization until the table delta is zero.

### Task 6: History, Polish, and Documentation

**Files:**
- Create or modify files under `ios/PokerLedger/Features/History/`
- Create: `ios/README.md`

- [ ] Build finalized session detail and player lifetime views.
- [ ] Document how to generate/open the project, what is verified locally, and what still requires full Xcode/App Store credentials.
- [ ] Run `swift test` and `xcodegen generate` as the verification baseline.
