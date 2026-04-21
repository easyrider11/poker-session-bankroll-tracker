import Foundation

public struct SessionSeatSummary: Equatable, Sendable {
    public var totalCashInCents: Int
    public var totalCashOutCents: Int
    public var profitCents: Int

    public init(totalCashInCents: Int, totalCashOutCents: Int) {
        self.totalCashInCents = totalCashInCents
        self.totalCashOutCents = totalCashOutCents
        self.profitCents = totalCashOutCents - totalCashInCents
    }
}

public struct SessionSummary: Equatable, Sendable {
    public var totalCashInCents: Int
    public var totalCashOutCents: Int
    public var deltaCents: Int
    public var seatSummaries: [UUID: SessionSeatSummary]

    public var isBalanced: Bool {
        deltaCents == 0
    }
}

public enum SessionMath {
    public static func summary(for seat: SessionSeat) -> SessionSeatSummary {
        let totalCashIn = seat.events
            .filter { $0.type == .cashIn }
            .reduce(into: 0) { partialResult, event in
                partialResult += event.amountCents
            }

        let totalCashOut = seat.events
            .filter { $0.type == .cashOut }
            .reduce(into: 0) { partialResult, event in
                partialResult += event.amountCents
            }

        return SessionSeatSummary(totalCashInCents: totalCashIn, totalCashOutCents: totalCashOut)
    }

    public static func summary(for session: PokerSessionRecord) -> SessionSummary {
        let summaries = Dictionary(uniqueKeysWithValues: session.seats.map { seat in
            (seat.playerID, summary(for: seat))
        })

        let totalCashIn = summaries.values.reduce(into: 0) { $0 += $1.totalCashInCents }
        let totalCashOut = summaries.values.reduce(into: 0) { $0 += $1.totalCashOutCents }

        return SessionSummary(
            totalCashInCents: totalCashIn,
            totalCashOutCents: totalCashOut,
            deltaCents: totalCashOut - totalCashIn,
            seatSummaries: summaries
        )
    }
}

public extension SessionSeat {
    var summary: SessionSeatSummary {
        SessionMath.summary(for: self)
    }
}

public extension PokerSessionRecord {
    var summary: SessionSummary {
        SessionMath.summary(for: self)
    }
}
