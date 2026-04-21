import Foundation
import Testing

@testable import PokerLedgerCore

@Test
func rejectsDuplicatePlayersAndZeroOpeningBuyIn() throws {
    let playerID = UUID(uuidString: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE")!

    #expect(throws: SessionWorkflowError.self) {
        try SessionWorkflow.createDraftSession(
            title: "Friday Night",
            sessionDate: Date(timeIntervalSince1970: 1_713_564_800),
            notes: "Deep stack",
            seating: [
                SessionSeatInput(playerID: playerID, openingBuyInCents: 10_000),
                SessionSeatInput(playerID: playerID, openingBuyInCents: 20_000),
            ],
            now: Date(timeIntervalSince1970: 1_713_564_800)
        )
    }

    #expect(throws: SessionWorkflowError.self) {
        try SessionWorkflow.createDraftSession(
            title: "Friday Night",
            sessionDate: Date(timeIntervalSince1970: 1_713_564_800),
            notes: "",
            seating: [
                SessionSeatInput(playerID: UUID(), openingBuyInCents: 0),
            ],
            now: Date(timeIntervalSince1970: 1_713_564_800)
        )
    }
}

@Test
func appendingEventsUpdatesTotalsAndProfit() throws {
    let playerID = UUID(uuidString: "11111111-2222-3333-4444-555555555555")!
    var session = try SessionWorkflow.createDraftSession(
        title: "Main Game",
        sessionDate: Date(timeIntervalSince1970: 1_713_564_800),
        notes: "Table 1",
        seating: [
            SessionSeatInput(playerID: playerID, openingBuyInCents: 10_000),
        ],
        now: Date(timeIntervalSince1970: 1_713_564_800)
    )

    session = try SessionWorkflow.appendEvent(
        to: session,
        playerID: playerID,
        type: .cashIn,
        amountCents: 5_000,
        origin: .rebuy,
        note: nil,
        at: Date(timeIntervalSince1970: 1_713_565_100)
    )

    session = try SessionWorkflow.appendEvent(
        to: session,
        playerID: playerID,
        type: .cashOut,
        amountCents: 18_000,
        origin: .cashOut,
        note: "Bagged chips",
        at: Date(timeIntervalSince1970: 1_713_565_400)
    )

    let seat = try #require(session.seats.first)
    let summary = seat.summary

    #expect(summary.totalCashInCents == 15_000)
    #expect(summary.totalCashOutCents == 18_000)
    #expect(summary.profitCents == 3_000)
}

@Test
func finalizeRejectsNonZeroTableDelta() throws {
    let playerA = PlayerProfile(name: "Alex", nickname: nil)
    let playerB = PlayerProfile(name: "Jordan", nickname: "J")

    let session = try SessionWorkflow.createDraftSession(
        title: "Loose Friday",
        sessionDate: Date(timeIntervalSince1970: 1_713_564_800),
        notes: "",
        seating: [
            SessionSeatInput(playerID: playerA.id, openingBuyInCents: 10_000),
            SessionSeatInput(playerID: playerB.id, openingBuyInCents: 10_000),
        ],
        now: Date(timeIntervalSince1970: 1_713_564_800)
    )

    let afterCashOutA = try SessionWorkflow.appendEvent(
        to: session,
        playerID: playerA.id,
        type: .cashOut,
        amountCents: 21_000,
        origin: .cashOut,
        note: nil,
        at: Date(timeIntervalSince1970: 1_713_565_200)
    )

    let afterCashOutB = try SessionWorkflow.appendEvent(
        to: afterCashOutA,
        playerID: playerB.id,
        type: .cashOut,
        amountCents: 1_000,
        origin: .cashOut,
        note: nil,
        at: Date(timeIntervalSince1970: 1_713_565_300)
    )

    #expect(throws: SessionWorkflowError.self) {
        try SessionWorkflow.finalize(
            session: afterCashOutB,
            players: [playerA, playerB],
            at: Date(timeIntervalSince1970: 1_713_565_500)
        )
    }
}

@Test
func finalizeLocksSessionAndWritesLifetimeStats() throws {
    let playerA = PlayerProfile(name: "Alex", nickname: nil)
    let playerB = PlayerProfile(name: "Jordan", nickname: nil)

    let session = try SessionWorkflow.createDraftSession(
        title: "Zero Sum",
        sessionDate: Date(timeIntervalSince1970: 1_713_564_800),
        notes: "Deep stack",
        seating: [
            SessionSeatInput(playerID: playerA.id, openingBuyInCents: 10_000),
            SessionSeatInput(playerID: playerB.id, openingBuyInCents: 10_000),
        ],
        now: Date(timeIntervalSince1970: 1_713_564_800)
    )

    let afterCashOutA = try SessionWorkflow.appendEvent(
        to: session,
        playerID: playerA.id,
        type: .cashOut,
        amountCents: 14_000,
        origin: .cashOut,
        note: nil,
        at: Date(timeIntervalSince1970: 1_713_565_200)
    )

    let balancedSession = try SessionWorkflow.appendEvent(
        to: afterCashOutA,
        playerID: playerB.id,
        type: .cashOut,
        amountCents: 6_000,
        origin: .cashOut,
        note: nil,
        at: Date(timeIntervalSince1970: 1_713_565_300)
    )

    let result = try SessionWorkflow.finalize(
        session: balancedSession,
        players: [playerA, playerB],
        at: Date(timeIntervalSince1970: 1_713_565_500)
    )

    #expect(result.session.status == .finalized)
    #expect(result.session.finalizedAt == Date(timeIntervalSince1970: 1_713_565_500))

    let updatedAlex = try #require(result.players.first(where: { $0.id == playerA.id }))
    let updatedJordan = try #require(result.players.first(where: { $0.id == playerB.id }))

    #expect(updatedAlex.lifetimeBuyInCents == 10_000)
    #expect(updatedAlex.lifetimeCashOutCents == 14_000)
    #expect(updatedAlex.lifetimeProfitCents == 4_000)
    #expect(updatedAlex.sessionCount == 1)

    #expect(updatedJordan.lifetimeBuyInCents == 10_000)
    #expect(updatedJordan.lifetimeCashOutCents == 6_000)
    #expect(updatedJordan.lifetimeProfitCents == -4_000)
    #expect(updatedJordan.sessionCount == 1)
}
