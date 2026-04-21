import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct SessionDetailView: View {
    @Environment(AppModel.self) private var model
    let sessionID: UUID

    var body: some View {
        Group {
            if let session = model.session(for: sessionID) {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        overview(session: session)
                        playerBreakdown(session: session)
                        notesCard(session: session)
                    }
                    .padding()
                }
            } else {
                ScrollView {
                    EmptyCardState(
                        title: "这场牌局已经不存在了",
                        subtitle: "可能是归档文件被更新，或者当前筛选结果已经变化。",
                        actionTitle: nil,
                        action: nil
                    )
                    .padding()
                }
            }
        }
        .plShellBackground()
        .navigationTitle("牌局详情")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    private func overview(session: PokerSessionRecord) -> some View {
        let summary = model.sessionSummary(for: session)
        return PLCard(title: session.title, subtitle: session.status == .draft ? "草稿" : "已归档") {
            HStack(spacing: 12) {
                summaryBadge(title: "买入", value: formatMoney(cents: summary.totalCashInCents))
                summaryBadge(title: "出池", value: formatMoney(cents: summary.totalCashOutCents))
                summaryBadge(title: "差额", value: formatSignedMoney(cents: summary.deltaCents), tone: balanceTone(for: summary.deltaCents))
            }
        }
    }

    private func playerBreakdown(session: PokerSessionRecord) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "玩家结算", subtitle: "逐位展开现金流和盈利。")
            ForEach(session.seats) { seat in
                let player = model.player(for: seat.playerID)
                let totals = seat.summary
                PLCard(title: player?.name ?? "玩家", subtitle: player?.nickname) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Buy-in \(formatMoney(cents: totals.totalCashInCents))")
                            Text("Cash-out \(formatMoney(cents: totals.totalCashOutCents))")
                        }
                        Spacer()
                        Text(formatSignedMoney(cents: totals.profitCents))
                            .font(.system(.headline, design: .monospaced).weight(.bold))
                            .foregroundStyle(profitTone(for: totals.profitCents))
                            .monospacedDigit()
                    }
                }
            }
        }
    }

    private func notesCard(session: PokerSessionRecord) -> some View {
        PLCard(title: "备注", subtitle: nil) {
            Text(session.notes.isEmpty ? "没有备注。" : session.notes)
                .foregroundStyle(PLTheme.ink)
        }
    }

    private func summaryBadge(title: String, value: String, tone: Color = PLTheme.ink) -> some View {
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
