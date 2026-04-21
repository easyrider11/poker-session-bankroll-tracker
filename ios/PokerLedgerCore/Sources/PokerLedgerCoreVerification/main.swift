import Foundation
import PokerLedgerCore

struct VerificationFailure: Error, CustomStringConvertible {
    let description: String
}

@discardableResult
func check(_ description: String, _ condition: @autoclosure () -> Bool) throws -> String {
    guard condition() else {
        throw VerificationFailure(description: description)
    }
    return description
}

@main
struct PokerLedgerCoreVerificationRunner {
    static func main() throws {
        let scenarios = [
            try verifyMoneyParsing(),
            try verifySessionWorkflow(),
            try verifyArchiveRoundTrip(),
        ]

        print("Verified scenarios:")
        scenarios.forEach { print("- \($0)") }
    }

    static func verifyMoneyParsing() throws -> String {
        try check("parses 100 dollars", MoneyParser.cents(from: "100") == 10_000)
        try check("parses cents", MoneyParser.cents(from: "0.99") == 99)
        try check("rejects invalid money", MoneyParser.cents(from: "12.345") == nil)
        return "money parsing"
    }

    static func verifySessionWorkflow() throws -> String {
        let alex = PlayerProfile(name: "Alex", nickname: nil)
        let jordan = PlayerProfile(name: "Jordan", nickname: nil)
        let baseDate = Date(timeIntervalSince1970: 1_713_564_800)

        var session = try SessionWorkflow.createDraftSession(
            title: "Verification Table",
            sessionDate: baseDate,
            notes: "Verifier",
            seating: [
                SessionSeatInput(playerID: alex.id, openingBuyInCents: 10_000),
                SessionSeatInput(playerID: jordan.id, openingBuyInCents: 10_000),
            ],
            now: baseDate
        )

        session = try SessionWorkflow.appendEvent(
            to: session,
            playerID: alex.id,
            type: .cashOut,
            amountCents: 13_000,
            origin: .cashOut,
            at: baseDate.addingTimeInterval(600)
        )

        session = try SessionWorkflow.appendEvent(
            to: session,
            playerID: jordan.id,
            type: .cashOut,
            amountCents: 7_000,
            origin: .cashOut,
            at: baseDate.addingTimeInterval(700)
        )

        let result = try SessionWorkflow.finalize(
            session: session,
            players: [alex, jordan],
            at: baseDate.addingTimeInterval(800)
        )

        try check("session finalized", result.session.status == .finalized)
        try check("table stays balanced", result.session.summary.deltaCents == 0)
        try check("lifetime totals updated", result.players.map(\.sessionCount).reduce(0, +) == 2)
        return "session workflow"
    }

    static func verifyArchiveRoundTrip() throws -> String {
        let folder = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        let store = ArchiveStore(fileURL: folder.appendingPathComponent("archive.json"))
        let archive = SampleData.demoArchive(referenceDate: Date(timeIntervalSince1970: 1_713_564_800))

        try store.save(archive)
        let loaded = try store.load()
        try check("archive roundtrip", loaded == archive)
        return "archive roundtrip"
    }
}
