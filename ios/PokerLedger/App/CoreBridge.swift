import Foundation

#if canImport(PokerLedgerCore)
@_exported import PokerLedgerCore
#else
public enum SessionStatus: String, Codable, Sendable {
    case draft
    case finalized
}

public enum SessionLedgerEventType: String, Codable, Sendable {
    case cashIn
    case cashOut
}

public enum SessionLedgerEventOrigin: String, Codable, Sendable {
    case openingBuyIn
    case rebuy
    case cashOut
    case correction
}

public struct PlayerProfile: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var nickname: String?
    public var createdAt: Date
    public var updatedAt: Date
    public var lifetimeBuyInCents: Int
    public var lifetimeCashOutCents: Int
    public var lifetimeProfitCents: Int
    public var sessionCount: Int

    public init(
        id: UUID = UUID(),
        name: String,
        nickname: String?,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        lifetimeBuyInCents: Int = 0,
        lifetimeCashOutCents: Int = 0,
        lifetimeProfitCents: Int = 0,
        sessionCount: Int = 0
    ) {
        self.id = id
        self.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        self.nickname = nickname?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.lifetimeBuyInCents = lifetimeBuyInCents
        self.lifetimeCashOutCents = lifetimeCashOutCents
        self.lifetimeProfitCents = lifetimeProfitCents
        self.sessionCount = sessionCount
    }

    public var displayName: String {
        if let nickname, !nickname.isEmpty {
            return "\(name) (\(nickname))"
        }
        return name
    }
}

public struct SessionLedgerEvent: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var playerID: UUID
    public var type: SessionLedgerEventType
    public var amountCents: Int
    public var createdAt: Date
    public var note: String?
    public var origin: SessionLedgerEventOrigin

    public init(
        id: UUID = UUID(),
        playerID: UUID,
        type: SessionLedgerEventType,
        amountCents: Int,
        createdAt: Date = .now,
        note: String? = nil,
        origin: SessionLedgerEventOrigin
    ) {
        self.id = id
        self.playerID = playerID
        self.type = type
        self.amountCents = amountCents
        self.createdAt = createdAt
        self.note = note?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
        self.origin = origin
    }
}

public struct SessionSeat: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var playerID: UUID
    public var joinedAt: Date
    public var events: [SessionLedgerEvent]

    public init(
        id: UUID = UUID(),
        playerID: UUID,
        joinedAt: Date = .now,
        events: [SessionLedgerEvent] = []
    ) {
        self.id = id
        self.playerID = playerID
        self.joinedAt = joinedAt
        self.events = events.sorted(by: { $0.createdAt < $1.createdAt })
    }

    public var summary: SessionSeatSummary {
        SessionMath.summary(for: self)
    }
}

public struct PokerSessionRecord: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var title: String
    public var sessionDate: Date
    public var notes: String
    public var status: SessionStatus
    public var createdAt: Date
    public var updatedAt: Date
    public var finalizedAt: Date?
    public var seats: [SessionSeat]

    public init(
        id: UUID = UUID(),
        title: String,
        sessionDate: Date,
        notes: String,
        status: SessionStatus = .draft,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        finalizedAt: Date? = nil,
        seats: [SessionSeat]
    ) {
        self.id = id
        self.title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        self.sessionDate = sessionDate
        self.notes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.finalizedAt = finalizedAt
        self.seats = seats
    }

    public var summary: SessionSummary {
        SessionMath.summary(for: self)
    }
}

public struct AppArchive: Codable, Equatable, Sendable {
    public var players: [PlayerProfile]
    public var sessions: [PokerSessionRecord]

    public init(players: [PlayerProfile] = [], sessions: [PokerSessionRecord] = []) {
        self.players = players
        self.sessions = sessions
    }
}

public struct SessionSeatInput: Equatable, Sendable {
    public var playerID: UUID
    public var openingBuyInCents: Int

    public init(playerID: UUID, openingBuyInCents: Int) {
        self.playerID = playerID
        self.openingBuyInCents = openingBuyInCents
    }
}

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

public struct ArchiveStore: Sendable {
    public var fileURL: URL

    public init(fileURL: URL) {
        self.fileURL = fileURL
    }

    public func load() throws -> AppArchive {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return AppArchive()
        }

        let data = try Data(contentsOf: fileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(AppArchive.self, from: data)
    }

    public func save(_ archive: AppArchive) throws {
        let directoryURL = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(archive)
        try data.write(to: fileURL, options: .atomic)
    }

    public static func defaultFileURL(fileManager: FileManager = .default) throws -> URL {
        let supportDirectory = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )

        let directory = supportDirectory.appendingPathComponent("PokerLedger", isDirectory: true)
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("archive.json")
    }
}

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

extension String {
    fileprivate var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}

extension SessionSeat {
    var summary: SessionSeatSummary {
        SessionMath.summary(for: self)
    }
}

extension PokerSessionRecord {
    var summary: SessionSummary {
        SessionMath.summary(for: self)
    }
}
#endif
