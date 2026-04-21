import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct PlayersView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                header
                playerCards
            }
            .padding()
        }
        .navigationTitle("玩家")
        .navigationBarTitleDisplayMode(.large)
        .plShellBackground()
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    private var header: some View {
        PLCard(title: "玩家名册", subtitle: "移动端友好的卡片式概览。") {
            HStack(spacing: 12) {
                summaryTile(title: "总玩家", value: "\(model.archive.players.count)")
                summaryTile(title: "活跃度", value: "\(model.archive.players.map(\.sessionCount).reduce(0, +)) 场")
            }
        }
    }

    private var playerCards: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "最近使用顺序", subtitle: "按出场频率和最近更新时间排序。")
            if model.orderedPlayers.isEmpty {
                EmptyCardState(
                    title: "还没有常用玩家",
                    subtitle: "从新建牌局里边选边加，名册会自动积累下来。",
                    actionTitle: "新建牌局",
                    action: {
                        model.selectedTab = .sessions
                        model.beginNewSessionWizard()
                    }
                )
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(model.orderedPlayers) { player in
                        NavigationLink {
                            PlayerDetailView(playerID: player.id)
                        } label: {
                            PlayerCard(player: player)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func summaryTile(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(PLTheme.mutedInk)
            Text(value)
                .font(.system(.headline, design: .monospaced).weight(.bold))
                .foregroundStyle(PLTheme.ink)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(PLTheme.surfaceAlt))
    }
}

struct PlayerCard: View {
    let player: PlayerProfile

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(player.name)
                    .font(PLTheme.headlineFont)
                    .foregroundStyle(PLTheme.ink)
                if let nickname = player.nickname {
                    Text(nickname)
                        .font(.footnote)
                        .foregroundStyle(PLTheme.mutedInk)
                }
                Text("\(player.sessionCount) 场记录")
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                Text(formatSignedMoney(cents: player.lifetimeProfitCents))
                    .font(.system(.headline, design: .monospaced).weight(.bold))
                    .foregroundStyle(profitTone(for: player.lifetimeProfitCents))
                    .monospacedDigit()
                Text("买入 \(formatMoney(cents: player.lifetimeBuyInCents))")
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
                Text("出池 \(formatMoney(cents: player.lifetimeCashOutCents))")
                    .font(.caption)
                    .foregroundStyle(PLTheme.mutedInk)
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous).fill(PLTheme.surface))
        .overlay(RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous).stroke(PLTheme.border, lineWidth: 1))
    }
}
