import Foundation
import Observation
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

@MainActor
@Observable
final class AppModel {
    var archive: AppArchive
    var selectedTab: AppTab = .sessions
    var isPresentingNewSessionWizard = false
    var selectedAmountEditor: AmountEntryContext?
    var selectedSessionID: UUID?
    var selectedPlayerID: UUID?
    var activeAlert: AppAlertContext?

    let store: ArchiveStore

    init(store: ArchiveStore = AppModel.makeStore()) {
        self.store = store
        let fileExists = FileManager.default.fileExists(atPath: store.fileURL.path)

        do {
            let loadedArchive = try store.load()
            self.archive = loadedArchive
        } catch {
            self.archive = AppArchive()
            self.activeAlert = AppAlertContext(
                title: "未能读取本地牌局",
                message: "PokerLedger 读取归档失败，已用空数据启动。请检查本地数据文件后再重试。"
            )
        }

        if !fileExists && archive.players.isEmpty && archive.sessions.isEmpty {
            self.archive = AppArchive()
        }

        if activeAlert == nil,
           store.fileURL.path.hasPrefix(FileManager.default.temporaryDirectory.path) {
            self.activeAlert = AppAlertContext(
                title: "当前处于临时存储模式",
                message: "应用暂时无法写入 Application Support，重启后历史数据可能丢失。"
            )
        }

        self.selectedSessionID = currentDraftSession?.id
    }

    var currentDraftSession: PokerSessionRecord? {
        archive.sessions.first { $0.status == .draft }
    }

    var currentLiveSession: PokerSessionRecord? {
        if let selectedSessionID,
           let session = archive.sessions.first(where: { $0.id == selectedSessionID }),
           session.status == .draft {
            return session
        }
        return currentDraftSession
    }

    var finalizedSessions: [PokerSessionRecord] {
        archive.sessions
            .filter { $0.status == .finalized }
            .sorted { $0.sessionDate > $1.sessionDate }
    }

    var draftSessions: [PokerSessionRecord] {
        archive.sessions
            .filter { $0.status == .draft }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    var orderedPlayers: [PlayerProfile] {
        archive.players.sorted {
            if $0.sessionCount == $1.sessionCount {
                return $0.updatedAt > $1.updatedAt
            }
            return $0.sessionCount > $1.sessionCount
        }
    }

    var homeHighlights: [MetricTileValue] {
        let totalBuyIn = archive.sessions.map(\.summary.totalCashInCents).reduce(0, +)
        return [
            MetricTileValue(title: "玩家", value: "\(archive.players.count)", subtitle: "常用座位"),
            MetricTileValue(title: "牌局", value: "\(archive.sessions.count)", subtitle: "历史总数"),
            MetricTileValue(title: "活跃草稿", value: "\(draftSessions.count)", subtitle: "可继续"),
            MetricTileValue(
                title: "总买入",
                value: formatMoney(cents: totalBuyIn),
                subtitle: "All sessions"
            ),
        ]
    }

    func beginNewSessionWizard() {
        isPresentingNewSessionWizard = true
    }

    @discardableResult
    func startDraftSession(from draft: SessionWizardDraft) -> Bool {
        let seating = draft.selectedPlayerIDs.map { playerID in
            SessionSeatInput(
                playerID: playerID,
                openingBuyInCents: max(0, draft.openingBuyIns[playerID] ?? draft.sharedOpeningBuyInCents)
            )
        }

        do {
            let session = try SessionWorkflow.createDraftSession(
                title: draft.title,
                sessionDate: draft.sessionDate,
                notes: draft.notes,
                seating: seating,
                now: Date()
            )

            archive.sessions.insert(session, at: 0)
            selectedSessionID = session.id
            selectedTab = .sessions
            isPresentingNewSessionWizard = false
            persist()
            return true
        } catch {
            present(error, title: "未能创建牌局")
            return false
        }
    }

    @discardableResult
    func appendEvent(to seatID: UUID, amountCents: Int, type: SessionLedgerEventType, note: String?, origin: SessionLedgerEventOrigin) -> Bool {
        guard let sessionIndex = archive.sessions.firstIndex(where: { $0.id == selectedSessionID }),
              archive.sessions[sessionIndex].status == .draft,
              let seatIndex = archive.sessions[sessionIndex].seats.firstIndex(where: { $0.id == seatID }) else {
            present(
                title: "当前牌局不可编辑",
                message: "只有进行中的 draft session 才能继续记录 cash in / cash out。"
            )
            return false
        }

        do {
            let updated = try SessionWorkflow.appendEvent(
                to: archive.sessions[sessionIndex],
                playerID: archive.sessions[sessionIndex].seats[seatIndex].playerID,
                type: type,
                amountCents: amountCents,
                origin: origin,
                note: note,
                at: Date()
            )

            archive.sessions[sessionIndex] = updated
            persist()
            return true
        } catch {
            present(error, title: "未能保存这笔流水")
            return false
        }
    }

    func removeDraftSeat(_ seatID: UUID) {
        guard let sessionIndex = archive.sessions.firstIndex(where: { $0.id == selectedSessionID }),
              archive.sessions[sessionIndex].status == .draft else {
            return
        }

        archive.sessions[sessionIndex].seats.removeAll { $0.id == seatID }
        archive.sessions[sessionIndex].updatedAt = Date()
        persist()
    }

    func finalizeCurrentSession() {
        guard let sessionIndex = archive.sessions.firstIndex(where: { $0.id == selectedSessionID }) else {
            present(title: "没有可结算的牌局", message: "先创建或继续一个 draft session。")
            return
        }

        let session = archive.sessions[sessionIndex]
        guard session.status == .draft else {
            present(title: "这场牌局已经归档", message: "Finalized session 不能再次结算。")
            return
        }

        guard !session.seats.isEmpty else {
            present(title: "牌局里还没有玩家", message: "至少保留一位玩家后才能结算。")
            return
        }

        guard session.summary.isBalanced else {
            present(
                title: "桌面还没平衡",
                message: "当前差额为 \(formatSignedMoney(cents: session.summary.deltaCents))，请继续录入 cash in / cash out。"
            )
            return
        }

        do {
            let result = try SessionWorkflow.finalize(session: session, players: archive.players, at: Date())
            archive.players = result.players
            archive.sessions[sessionIndex] = result.session
            selectedTab = .history
            persist()
        } catch {
            present(error, title: "未能完成结算")
        }
    }

    func addPlayer(named name: String) -> PlayerProfile? {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else {
            present(title: "玩家名不能为空", message: "先输入一个玩家名称，再加入当前牌局。")
            return nil
        }

        let player = PlayerProfile(
            id: UUID(),
            name: trimmedName,
            nickname: nil,
            createdAt: Date(),
            updatedAt: Date(),
            lifetimeBuyInCents: 0,
            lifetimeCashOutCents: 0,
            lifetimeProfitCents: 0,
            sessionCount: 0
        )
        archive.players.insert(player, at: 0)
        persist()
        return player
    }

    func save() {
        persist()
    }

    func sessionSummary(for session: PokerSessionRecord) -> PokerSessionCoreSummary {
        session.summary
    }

    func player(for id: UUID) -> PlayerProfile? {
        archive.players.first { $0.id == id }
    }

    func session(for id: UUID) -> PokerSessionRecord? {
        archive.sessions.first { $0.id == id }
    }

    private func persist() {
        do {
            try store.save(archive)
        } catch {
            present(error, title: "未能写入本地归档")
        }
    }

    private func present(_ error: Error, title: String) {
        let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        present(title: title, message: message)
    }

    private func present(title: String, message: String) {
        activeAlert = AppAlertContext(title: title, message: message)
    }

    nonisolated private static func makeStore() -> ArchiveStore {
        let url = (try? ArchiveStore.defaultFileURL()) ??
            FileManager.default.temporaryDirectory
                .appendingPathComponent("PokerLedger", isDirectory: true)
                .appendingPathComponent("archive.json")
        return ArchiveStore(fileURL: url)
    }
}

struct AppAlertContext: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let message: String
}

struct SessionWizardDraft: Hashable {
    var title: String = ""
    var sessionDate: Date = .now
    var notes: String = ""
    var selectedPlayerIDs: Set<UUID> = []
    var sharedOpeningBuyInCents: Int = 20000
    var openingBuyIns: [UUID: Int] = [:]

    var estimatedSeatCount: Int {
        selectedPlayerIDs.count
    }
}

enum AppTab: String, CaseIterable, Identifiable {
    case sessions
    case history
    case players

    var id: String { rawValue }
}

typealias PokerSessionCoreSummary = SessionSummary
