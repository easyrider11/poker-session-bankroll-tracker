import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct HistoryView: View {
    @Environment(AppModel.self) private var model
    @State private var scope: HistoryScope = .all

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                filterBar
                summaryCard
                sessionList
            }
            .padding()
        }
        .navigationTitle("历史")
        .navigationBarTitleDisplayMode(.large)
        .plShellBackground()
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    private var filterBar: some View {
        HStack(spacing: 8) {
            ForEach(HistoryScope.allCases) { option in
                Button {
                    scope = option
                } label: {
                    Text(option.title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(scope == option ? PLTheme.surface : PLTheme.surface.opacity(0.74))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background(Capsule().fill(scope == option ? PLTheme.backgroundDeep : Color.white.opacity(0.08)))
                        .overlay(Capsule().stroke(PLTheme.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
    }

    private var summaryCard: some View {
        let sessions = visibleSessions
        let totalCashIn = sessions.map { model.sessionSummary(for: $0).totalCashInCents }.reduce(0, +)
        let totalCashOut = sessions.map { model.sessionSummary(for: $0).totalCashOutCents }.reduce(0, +)
        return PLCard(title: "概览", subtitle: "历史页以卡片为主，移动端友好浏览。") {
            HStack(spacing: 12) {
                summaryTile(title: "总买入", value: formatMoney(cents: totalCashIn))
                summaryTile(title: "总出池", value: formatMoney(cents: totalCashOut))
                summaryTile(title: "草稿", value: "\(model.draftSessions.count)")
            }
        }
    }

    private var sessionList: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "牌局列表", subtitle: scope.subtitle)
            if visibleSessions.isEmpty {
                EmptyCardState(
                    title: "还没有符合条件的牌局",
                    subtitle: "完成第一场 session 后，这里会自动形成可回查的历史记录。",
                    actionTitle: "新建牌局",
                    action: {
                        model.selectedTab = .sessions
                        model.beginNewSessionWizard()
                    }
                )
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(visibleSessions) { session in
                        NavigationLink {
                            SessionDetailView(sessionID: session.id)
                        } label: {
                            SessionHistoryCard(session: session)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var visibleSessions: [PokerSessionRecord] {
        switch scope {
        case .all:
            return model.archive.sessions.sorted { $0.updatedAt > $1.updatedAt }
        case .draft:
            return model.draftSessions
        case .finalized:
            return model.finalizedSessions
        }
    }

    private func summaryTile(title: String, value: String, tone: Color = PLTheme.ink) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(PLTheme.mutedInk)
            Text(value)
                .font(.system(.headline, design: .monospaced).weight(.bold))
                .foregroundStyle(tone)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(PLTheme.surfaceAlt))
    }
}

enum HistoryScope: String, CaseIterable, Identifiable {
    case all
    case draft
    case finalized

    var id: String { rawValue }

    var title: String {
        switch self {
        case .all: return "全部"
        case .draft: return "草稿"
        case .finalized: return "已完成"
        }
    }

    var subtitle: String {
        switch self {
        case .all: return "所有 session"
        case .draft: return "未结算的 session"
        case .finalized: return "已归档的 session"
        }
    }
}

struct SessionHistoryCard: View {
    @Environment(AppModel.self) private var model
    let session: PokerSessionRecord

    var body: some View {
        let summary = model.sessionSummary(for: session)

        return HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(session.title)
                    .font(PLTheme.headlineFont)
                    .foregroundStyle(PLTheme.ink)
                Text(session.sessionDate.formatted(date: .abbreviated, time: .omitted))
                    .font(.footnote)
                    .foregroundStyle(PLTheme.mutedInk)
                Text("\(session.seats.count) 位玩家")
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                StatusPill(text: session.status == .draft ? "Draft" : "Final", tone: session.status == .draft ? PLTheme.backgroundDeep : PLTheme.mutedInk)
                if session.status == .draft {
                    Text(formatSignedMoney(cents: summary.deltaCents))
                        .font(.system(.headline, design: .monospaced).weight(.bold))
                        .foregroundStyle(balanceTone(for: summary.deltaCents))
                        .monospacedDigit()
                } else {
                    Text("已平衡")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(PLTheme.positive)
                }
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous).fill(PLTheme.surface))
        .overlay(RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous).stroke(PLTheme.border, lineWidth: 1))
    }
}
