import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct LiveSessionView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if let session = model.currentLiveSession {
                    headerCard(session: session)
                    seatCards(session: session)
                    eventFeed(session: session)
                    footerActions(session: session)
                } else {
                    EmptyCardState(
                        title: "没有活跃牌局",
                        subtitle: "从首页新建一个 session，或者回到历史查看已归档记录。",
                        actionTitle: "新建牌局",
                        action: { model.beginNewSessionWizard() }
                    )
                }
            }
            .padding()
        }
        .navigationTitle("Live Session")
        .navigationBarTitleDisplayMode(.large)
        .plShellBackground()
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    private func headerCard(session: PokerSessionRecord) -> some View {
        let summary = model.sessionSummary(for: session)
        let isFinalizable = session.status == .draft && summary.isBalanced && !session.seats.isEmpty
        return PLCard(title: session.title, subtitle: session.status == .draft ? "session-first live flow" : "frozen settlement") {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(session.sessionDate.formatted(date: .abbreviated, time: .shortened))
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(PLTheme.mutedInk)
                        Text(isFinalizable ? "可以结算" : "等待平衡")
                            .font(.headline)
                            .foregroundStyle(isFinalizable ? PLTheme.backgroundDeep : PLTheme.negative)
                    }
                    Spacer()
                    StatusPill(text: session.status == .draft ? "Draft" : "Final", tone: session.status == .draft ? PLTheme.backgroundDeep : PLTheme.mutedInk)
                }

                HStack(spacing: 12) {
                    summaryBadge(title: "买入", value: formatMoney(cents: summary.totalCashInCents))
                    summaryBadge(title: "出池", value: formatMoney(cents: summary.totalCashOutCents))
                    summaryBadge(title: "差额", value: formatSignedMoney(cents: summary.deltaCents), tone: balanceTone(for: summary.deltaCents))
                }
            }
        }
    }

    private func seatCards(session: PokerSessionRecord) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "座位卡片", subtitle: "每位玩家都通过 sheet 录入金额，不做表格 inline 编辑。")
            LazyVStack(spacing: 12) {
                ForEach(session.seats) { seat in
                    SeatCard(seat: seat, isEditable: session.status == .draft)
                }
            }
        }
    }

    private func eventFeed(session: PokerSessionRecord) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "事件流", subtitle: "按玩家聚合的最近事件。")
            LazyVStack(spacing: 10) {
                ForEach(session.seats.flatMap { seat in
                    seat.events.map { event in
                        SessionEventRow(event: event, playerName: model.player(for: seat.playerID)?.name ?? "玩家")
                    }
                }.sorted(by: { $0.event.createdAt > $1.event.createdAt }).prefix(8), id: \.event.id) { row in
                    row
                }
            }
        }
    }

    private func footerActions(session: PokerSessionRecord) -> some View {
        PLCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(session.status == .draft ? "收尾动作" : "已归档")
                    .font(PLTheme.headlineFont)
                    .foregroundStyle(PLTheme.ink)

                PrimaryActionBar(
                    primaryTitle: session.status == .draft ? "结算牌局" : "查看历史",
                    secondaryTitle: session.status == .draft ? "保存草稿" : nil,
                    primaryAction: {
                        if session.status == .draft {
                            model.finalizeCurrentSession()
                        } else {
                            model.selectedTab = .history
                        }
                    },
                    secondaryAction: session.status == .draft ? { model.save() } : nil
                )
            }
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

struct SeatCard: View {
    @Environment(AppModel.self) private var model
    let seat: SessionSeat
    let isEditable: Bool

    var body: some View {
        let totals = seat.summary
        let player = model.player(for: seat.playerID)

        return PLCard(title: player?.displayName ?? "玩家", subtitle: player?.nickname) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Buy-in \(formatMoney(cents: totals.totalCashInCents))")
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(PLTheme.ink)
                        Text("Cash-out \(formatMoney(cents: totals.totalCashOutCents))")
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(PLTheme.ink)
                    }
                    Spacer()
                    Text(formatSignedMoney(cents: totals.profitCents))
                        .font(.system(.title3, design: .monospaced).weight(.bold))
                        .foregroundStyle(profitTone(for: totals.profitCents))
                        .monospacedDigit()
                }

                if isEditable {
                    HStack(spacing: 10) {
                        ActionButton(title: "买入", systemImage: "plus.circle.fill", tint: PLTheme.backgroundDeep) {
                            model.selectedAmountEditor = AmountEntryContext(
                                seatID: seat.id,
                                playerName: player?.name ?? "玩家",
                                mode: .cashIn,
                                amountCents: 10000
                            )
                        }
                        ActionButton(title: "出池", systemImage: "minus.circle.fill", tint: PLTheme.negative) {
                            model.selectedAmountEditor = AmountEntryContext(
                                seatID: seat.id,
                                playerName: player?.name ?? "玩家",
                                mode: .cashOut,
                                amountCents: 10000
                            )
                        }
                    }
                } else {
                    StatusPill(text: "已归档，不可再编辑", tone: PLTheme.mutedInk)
                }
            }
        }
    }
}

struct SessionEventRow: View {
    let event: SessionLedgerEvent
    let playerName: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(playerName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(PLTheme.ink)
                Text(event.origin.rawValue.replacingOccurrences(of: "openingBuyIn", with: "opening buy-in"))
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(event.type == .cashIn ? "+\(formatMoney(cents: event.amountCents))" : "-\(formatMoney(cents: event.amountCents))")
                    .font(.system(.subheadline, design: .monospaced).weight(.bold))
                    .foregroundStyle(event.type == .cashIn ? PLTheme.positive : PLTheme.negative)
                    .monospacedDigit()
                Text(event.createdAt, style: .time)
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(PLTheme.surface))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(PLTheme.border, lineWidth: 1))
    }
}
