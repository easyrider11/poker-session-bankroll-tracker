import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct SessionHubView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                heroSection
                metricsGrid
                activeSessionSection
                recentSessionsSection
            }
            .padding()
        }
        .navigationTitle("牌局")
        .navigationBarTitleDisplayMode(.large)
        .plShellBackground()
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    private var heroSection: some View {
        PLCard {
            VStack(alignment: .leading, spacing: 14) {
                StatusPill(text: model.currentDraftSession == nil ? "等待开局" : "正在进行", tone: PLTheme.backgroundDeep)

                VStack(alignment: .leading, spacing: 6) {
                    Text("PokerLedger")
                        .font(.system(.title, design: .rounded).weight(.bold))
                        .foregroundStyle(PLTheme.ink)
                    Text("Session-first ledger for live table flow.")
                        .font(.callout)
                        .foregroundStyle(PLTheme.mutedInk)
                }

                PrimaryActionBar(
                    primaryTitle: "新建牌局",
                    secondaryTitle: model.currentDraftSession == nil ? nil : "继续当前",
                    primaryAction: { model.beginNewSessionWizard() },
                    secondaryAction: {
                        if let session = model.currentDraftSession {
                            model.selectedSessionID = session.id
                        }
                    }
                )
            }
        }
    }

    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            ForEach(model.homeHighlights) { metric in
                PLMetricTile(metric: metric)
            }
        }
    }

    private var activeSessionSection: some View {
        Group {
            if let session = model.currentDraftSession {
                VStack(spacing: 12) {
                    SessionLivePreviewCard(session: session)

                    NavigationLink {
                        LiveSessionView()
                            .onAppear { model.selectedSessionID = session.id }
                    } label: {
                        HStack {
                            Text("打开 Live Session")
                                .font(.subheadline.weight(.semibold))
                            Spacer()
                            Image(systemName: "arrow.right")
                        }
                        .foregroundStyle(PLTheme.surface)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(PLTheme.backgroundDeep)
                        )
                    }
                    .buttonStyle(.plain)
                }
            } else {
                EmptyCardState(
                    title: "还没有进行中的牌局",
                    subtitle: "点上面的“新建牌局”进入 4-step wizard，先选人再开局。",
                    actionTitle: "开始新牌局",
                    action: { model.beginNewSessionWizard() }
                )
            }
        }
    }

    private var recentSessionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "最近牌局", subtitle: "快速回到最近的 session。")
            if model.archive.sessions.isEmpty {
                EmptyCardState(
                    title: "还没有历史牌局",
                    subtitle: "第一场牌局完成之后，最近记录会显示在这里。",
                    actionTitle: "新建牌局",
                    action: { model.beginNewSessionWizard() }
                )
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(Array(model.archive.sessions.prefix(4))) { session in
                        NavigationLink {
                            if session.status == .draft {
                                LiveSessionView()
                                    .onAppear { model.selectedSessionID = session.id }
                            } else {
                                SessionDetailView(sessionID: session.id)
                            }
                        } label: {
                            SessionRowCard(session: session)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

struct SessionLivePreviewCard: View {
    @Environment(AppModel.self) private var model
    let session: PokerSessionRecord

    var body: some View {
        let summary = model.sessionSummary(for: session)
        let seatCount = session.seats.count
        let isFinalizable = session.status == .draft && summary.isBalanced && !session.seats.isEmpty

        return PLCard(title: session.title, subtitle: session.status == .draft ? "Live Session" : "Finalized") {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(session.sessionDate, style: .date)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(PLTheme.mutedInk)
                        Text("\(seatCount) 名玩家")
                            .font(.headline)
                            .foregroundStyle(PLTheme.ink)
                    }
                    Spacer()
                    StatusPill(text: isFinalizable ? "可结算" : (session.status == .draft ? "可继续" : "已归档"), tone: session.status == .draft ? PLTheme.backgroundDeep : PLTheme.mutedInk)
                }

                HStack(spacing: 12) {
                    summaryTile(title: "买入", value: formatMoney(cents: summary.totalCashInCents))
                    summaryTile(title: "出池", value: formatMoney(cents: summary.totalCashOutCents))
                    summaryTile(title: "差额", value: formatSignedMoney(cents: summary.deltaCents), tone: balanceTone(for: summary.deltaCents))
                }

                PrimaryActionBar(
                    primaryTitle: session.status == .draft ? "进入 Live Session" : "查看详情",
                    secondaryTitle: session.status == .draft ? "结束牌局" : nil,
                    primaryAction: {
                        model.selectedSessionID = session.id
                        model.selectedTab = .sessions
                    },
                    secondaryAction: session.status == .draft ? { model.finalizeCurrentSession() } : nil
                )
            }
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

struct SessionRowCard: View {
    @Environment(AppModel.self) private var model
    let session: PokerSessionRecord

    var body: some View {
        let summary = model.sessionSummary(for: session)

        return HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text(session.title)
                    .font(PLTheme.headlineFont)
                    .foregroundStyle(PLTheme.ink)
                Text(session.sessionDate, style: .date)
                    .font(.footnote)
                    .foregroundStyle(PLTheme.mutedInk)
                if !session.notes.isEmpty {
                    Text(session.notes)
                        .font(.callout)
                        .foregroundStyle(PLTheme.mutedInk)
                        .lineLimit(2)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 8) {
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
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous).fill(PLTheme.surface))
        .overlay(RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous).stroke(PLTheme.border, lineWidth: 1))
    }
}
