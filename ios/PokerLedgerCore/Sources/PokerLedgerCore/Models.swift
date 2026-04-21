import Foundation

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

extension String {
    fileprivate var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}
