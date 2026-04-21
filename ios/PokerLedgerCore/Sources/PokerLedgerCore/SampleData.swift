import Foundation

public enum SampleData {
    public static func demoArchive(referenceDate: Date = .now) -> AppArchive {
        let alex = PlayerProfile(
            id: UUID(uuidString: "AAAAAAAA-1111-2222-3333-BBBBBBBBBBBB")!,
            name: "Alex Rivera",
            nickname: "Stacks",
            createdAt: referenceDate.addingTimeInterval(-86_400 * 30),
            updatedAt: referenceDate,
            lifetimeBuyInCents: 32_000,
            lifetimeCashOutCents: 36_500,
            lifetimeProfitCents: 4_500,
            sessionCount: 4
        )

        let jordan = PlayerProfile(
            id: UUID(uuidString: "CCCCCCCC-1111-2222-3333-DDDDDDDDDDDD")!,
            name: "Jordan Lee",
            nickname: nil,
            createdAt: referenceDate.addingTimeInterval(-86_400 * 20),
            updatedAt: referenceDate,
            lifetimeBuyInCents: 28_000,
            lifetimeCashOutCents: 23_500,
            lifetimeProfitCents: -4_500,
            sessionCount: 4
        )

        let alexSeat = SessionSeat(
            id: UUID(uuidString: "00000000-1111-2222-3333-444444444444")!,
            playerID: alex.id,
            joinedAt: referenceDate.addingTimeInterval(-7_200),
            events: [
                SessionLedgerEvent(
                    id: UUID(uuidString: "11111111-1111-2222-3333-444444444444")!,
                    playerID: alex.id,
                    type: .cashIn,
                    amountCents: 10_000,
                    createdAt: referenceDate.addingTimeInterval(-7_200),
                    origin: .openingBuyIn
                ),
                SessionLedgerEvent(
                    id: UUID(uuidString: "22222222-1111-2222-3333-444444444444")!,
                    playerID: alex.id,
                    type: .cashOut,
                    amountCents: 14_000,
                    createdAt: referenceDate.addingTimeInterval(-300),
                    note: "Cashed up",
                    origin: .cashOut
                ),
            ]
        )

        let jordanSeat = SessionSeat(
            id: UUID(uuidString: "55555555-1111-2222-3333-444444444444")!,
            playerID: jordan.id,
            joinedAt: referenceDate.addingTimeInterval(-7_200),
            events: [
                SessionLedgerEvent(
                    id: UUID(uuidString: "66666666-1111-2222-3333-444444444444")!,
                    playerID: jordan.id,
                    type: .cashIn,
                    amountCents: 10_000,
                    createdAt: referenceDate.addingTimeInterval(-7_200),
                    origin: .openingBuyIn
                ),
                SessionLedgerEvent(
                    id: UUID(uuidString: "77777777-1111-2222-3333-444444444444")!,
                    playerID: jordan.id,
                    type: .cashOut,
                    amountCents: 6_000,
                    createdAt: referenceDate.addingTimeInterval(-300),
                    note: "Short stack finish",
                    origin: .cashOut
                ),
            ]
        )

        let session = PokerSessionRecord(
            id: UUID(uuidString: "99999999-1111-2222-3333-444444444444")!,
            title: "Friday Felt",
            sessionDate: referenceDate.addingTimeInterval(-7_200),
            notes: "Friendly deep-stack session",
            status: .finalized,
            createdAt: referenceDate.addingTimeInterval(-7_200),
            updatedAt: referenceDate.addingTimeInterval(-300),
            finalizedAt: referenceDate.addingTimeInterval(-300),
            seats: [alexSeat, jordanSeat]
        )

        return AppArchive(players: [alex, jordan], sessions: [session])
    }
}
