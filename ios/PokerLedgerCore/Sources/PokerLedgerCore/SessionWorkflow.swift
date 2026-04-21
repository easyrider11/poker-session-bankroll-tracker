import Foundation

public enum SessionWorkflowError: Error, Equatable, LocalizedError, Sendable {
    case emptyTitle
    case noPlayers
    case duplicatePlayer
    case invalidAmount
    case playerNotFound
    case sessionLocked
    case nonZeroBalance(deltaCents: Int)

    public var errorDescription: String? {
        switch self {
        case .emptyTitle:
            return "Session title is required."
        case .noPlayers:
            return "Add at least one player before saving the session."
        case .duplicatePlayer:
            return "A player can only be added once per session."
        case .invalidAmount:
            return "Amounts must be greater than zero."
        case .playerNotFound:
            return "Player not found in the session."
        case .sessionLocked:
            return "Finalized sessions cannot be modified."
        case let .nonZeroBalance(deltaCents):
            return "Table delta must be zero before finalizing. Current delta: \(deltaCents)."
        }
    }
}

public struct FinalizationResult: Equatable, Sendable {
    public var session: PokerSessionRecord
    public var players: [PlayerProfile]

    public init(session: PokerSessionRecord, players: [PlayerProfile]) {
        self.session = session
        self.players = players
    }
}

public enum SessionWorkflow {
    public static func createDraftSession(
        title: String,
        sessionDate: Date,
        notes: String,
        seating: [SessionSeatInput],
        now: Date = .now
    ) throws -> PokerSessionRecord {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else {
            throw SessionWorkflowError.emptyTitle
        }
        guard !seating.isEmpty else {
            throw SessionWorkflowError.noPlayers
        }

        var seen = Set<UUID>()
        let seats = try seating.map { input -> SessionSeat in
            guard input.openingBuyInCents > 0 else {
                throw SessionWorkflowError.invalidAmount
            }
            guard !seen.contains(input.playerID) else {
                throw SessionWorkflowError.duplicatePlayer
            }
            seen.insert(input.playerID)

            let openingEvent = SessionLedgerEvent(
                playerID: input.playerID,
                type: .cashIn,
                amountCents: input.openingBuyInCents,
                createdAt: now,
                origin: .openingBuyIn
            )

            return SessionSeat(
                playerID: input.playerID,
                joinedAt: now,
                events: [openingEvent]
            )
        }

        return PokerSessionRecord(
            title: trimmedTitle,
            sessionDate: sessionDate,
            notes: notes,
            status: .draft,
            createdAt: now,
            updatedAt: now,
            finalizedAt: nil,
            seats: seats
        )
    }

    public static func appendEvent(
        to session: PokerSessionRecord,
        playerID: UUID,
        type: SessionLedgerEventType,
        amountCents: Int,
        origin: SessionLedgerEventOrigin,
        note: String? = nil,
        at: Date = .now
    ) throws -> PokerSessionRecord {
        guard session.status == .draft else {
            throw SessionWorkflowError.sessionLocked
        }
        guard amountCents > 0 else {
            throw SessionWorkflowError.invalidAmount
        }

        guard let seatIndex = session.seats.firstIndex(where: { $0.playerID == playerID }) else {
            throw SessionWorkflowError.playerNotFound
        }

        var updatedSession = session
        let event = SessionLedgerEvent(
            playerID: playerID,
            type: type,
            amountCents: amountCents,
            createdAt: at,
            note: note,
            origin: origin
        )

        updatedSession.seats[seatIndex].events.append(event)
        updatedSession.seats[seatIndex].events.sort(by: { $0.createdAt < $1.createdAt })
        updatedSession.updatedAt = at
        return updatedSession
    }

    public static func finalize(
        session: PokerSessionRecord,
        players: [PlayerProfile],
        at: Date = .now
    ) throws -> FinalizationResult {
        guard session.status == .draft else {
            throw SessionWorkflowError.sessionLocked
        }
        guard !session.seats.isEmpty else {
            throw SessionWorkflowError.noPlayers
        }

        let summary = session.summary
        guard summary.deltaCents == 0 else {
            throw SessionWorkflowError.nonZeroBalance(deltaCents: summary.deltaCents)
        }

        var playersByID = Dictionary(uniqueKeysWithValues: players.map { ($0.id, $0) })

        for seat in session.seats {
            guard var player = playersByID[seat.playerID] else {
                throw SessionWorkflowError.playerNotFound
            }

            let seatSummary = seat.summary
            player.lifetimeBuyInCents += seatSummary.totalCashInCents
            player.lifetimeCashOutCents += seatSummary.totalCashOutCents
            player.lifetimeProfitCents += seatSummary.profitCents
            player.sessionCount += 1
            player.updatedAt = at
            playersByID[seat.playerID] = player
        }

        var finalizedSession = session
        finalizedSession.status = .finalized
        finalizedSession.finalizedAt = at
        finalizedSession.updatedAt = at

        let updatedPlayers = players.map { playersByID[$0.id] ?? $0 }
        return FinalizationResult(session: finalizedSession, players: updatedPlayers)
    }
}
