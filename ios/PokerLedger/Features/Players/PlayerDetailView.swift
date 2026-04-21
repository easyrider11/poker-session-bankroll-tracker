import SwiftUI

struct PlayerDetailView: View {
    @Environment(AppModel.self) private var model
    let playerID: UUID

    private var recentSessions: [PokerSessionRecord] {
        model.archive.sessions
            .filter { session in
                session.seats.contains(where: { $0.playerID == playerID })
            }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    var body: some View {
        Group {
            if let player = model.player(for: playerID) {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        profileCard(player: player)
                        lifetimeCard(player: player)
                        recentSessionsCard
                    }
                    .padding()
                }
                .navigationTitle(player.name)
            } else {
                ScrollView {
                    EmptyCardState(
                        title: "这个玩家暂时找不到了",
                        subtitle: "名册刚刚发生过变更，返回上一页后再试一次。",
                        actionTitle: nil,
                        action: nil
                    )
                    .padding()
                }
                .navigationTitle("玩家详情")
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .plShellBackground()
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    private func profileCard(player: PlayerProfile) -> some View {
        PLCard(title: player.displayName, subtitle: "玩家画像") {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(player.sessionCount) 场记录")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(PLTheme.mutedInk)
                Text("最后更新 \(player.updatedAt.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
            }
        }
    }

    private func lifetimeCard(player: PlayerProfile) -> some View {
        PLCard(title: "Lifetime", subtitle: "长期买入、出池与盈亏。") {
            HStack(spacing: 12) {
                metric(title: "买入", value: formatMoney(cents: player.lifetimeBuyInCents))
                metric(title: "出池", value: formatMoney(cents: player.lifetimeCashOutCents))
                metric(
                    title: "盈亏",
                    value: formatSignedMoney(cents: player.lifetimeProfitCents),
                    tone: profitTone(for: player.lifetimeProfitCents)
                )
            }
        }
    }

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "最近牌局", subtitle: "从玩家视角回看参与过的 session。")
            LazyVStack(spacing: 12) {
                ForEach(recentSessions) { session in
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

    private func metric(title: String, value: String, tone: Color = PLTheme.ink) -> some View {
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
