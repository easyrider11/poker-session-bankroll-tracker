import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct NewSessionWizardView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var draft = SessionWizardDraft()
    @State private var step: Int = 0
    @State private var newPlayerName: String = ""
    @State private var sharedOpeningBuyInText: String = formatEditableAmount(cents: 20000)
    @State private var openingBuyInTexts: [UUID: String] = [:]

    private let steps = ["详情", "选人", "开局买入", "确认开始"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    stepStrip
                    wizardBody
                }
                .padding()
            }
            .plShellBackground()
            .navigationTitle("新建牌局")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("关闭") {
                        model.isPresentingNewSessionWizard = false
                        dismiss()
                    }
                    .foregroundStyle(.white)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(step == steps.count - 1 ? "开始" : "下一步") {
                        if step == steps.count - 1 {
                            syncBuyInDraft()
                            if model.startDraftSession(from: draft) {
                                dismiss()
                            }
                        } else {
                            if step == 2 {
                                syncBuyInDraft()
                            }
                            step += 1
                        }
                    }
                    .foregroundStyle(.white)
                    .disabled(!canAdvance)
                }
            }
        }
        .onAppear(perform: bootstrapBuyInInputs)
    }

    private var stepStrip: some View {
        HStack(spacing: 8) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, title in
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(index == step ? PLTheme.surface : PLTheme.surface.opacity(0.7))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        Capsule().fill(index == step ? PLTheme.backgroundDeep : Color.white.opacity(0.08))
                    )
                    .overlay(Capsule().stroke(PLTheme.border, lineWidth: 1))
            }
        }
        .padding(.top, 6)
    }

    @ViewBuilder
    private var wizardBody: some View {
        switch step {
        case 0:
            detailsStep
        case 1:
            playersStep
        case 2:
            buyInStep
        default:
            confirmStep
        }
    }

    private var detailsStep: some View {
        PLCard(title: "牌局详情", subtitle: "先把标题、日期、备注定下来。") {
            VStack(alignment: .leading, spacing: 12) {
                TextField("牌局标题", text: $draft.title)
                    .textFieldStyle(.roundedBorder)
                DatePicker("牌局日期", selection: $draft.sessionDate, displayedComponents: [.date, .hourAndMinute])
                TextField("备注", text: $draft.notes, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
            }
        }
    }

    private var playersStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            PLCard(title: "选择玩家", subtitle: "卡片化选择，支持边选边加。") {
                VStack(alignment: .leading, spacing: 10) {
                    TextField("快速添加玩家", text: $newPlayerName)
                        .textFieldStyle(.roundedBorder)

                    Button("添加并选中") {
                        if let player = model.addPlayer(named: newPlayerName) {
                            draft.selectedPlayerIDs.insert(player.id)
                            let openingBuyIn = parsedSharedOpeningBuyInCents ?? draft.sharedOpeningBuyInCents
                            draft.openingBuyIns[player.id] = openingBuyIn
                            openingBuyInTexts[player.id] = formatEditableAmount(cents: openingBuyIn)
                            newPlayerName = ""
                        }
                    }
                    .buttonStyle(PLGhostButtonStyle())
                    .disabled(newPlayerName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }

            LazyVStack(spacing: 10) {
                ForEach(model.orderedPlayers) { player in
                    Button {
                        toggleSelection(for: player.id)
                    } label: {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(player.name)
                                    .font(PLTheme.headlineFont)
                                    .foregroundStyle(PLTheme.ink)
                                Text("\(player.sessionCount) 场 · \(formatSignedMoney(cents: player.lifetimeProfitCents))")
                                    .font(.footnote)
                                    .foregroundStyle(PLTheme.mutedInk)
                            }
                            Spacer()
                            StatusPill(text: draft.selectedPlayerIDs.contains(player.id) ? "已选" : "未选", tone: PLTheme.backgroundDeep)
                        }
                        .padding(16)
                        .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(PLTheme.surface))
                        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(PLTheme.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var buyInStep: some View {
        PLCard(title: "开局买入", subtitle: "可以统一金额，也可以单独改每位玩家。") {
            VStack(alignment: .leading, spacing: 14) {
                TextField("共享开局买入", text: $sharedOpeningBuyInText)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)

                Button("同步到全部玩家") {
                    guard let sharedCents = parsedSharedOpeningBuyInCents else {
                        return
                    }
                    draft.sharedOpeningBuyInCents = sharedCents
                    for playerID in draft.selectedPlayerIDs {
                        draft.openingBuyIns[playerID] = sharedCents
                        openingBuyInTexts[playerID] = formatEditableAmount(cents: sharedCents)
                    }
                }
                .buttonStyle(PLGhostButtonStyle())
                .disabled(parsedSharedOpeningBuyInCents == nil || draft.selectedPlayerIDs.isEmpty)

                Text("当前选中 \(draft.selectedPlayerIDs.count) 人")
                    .font(.footnote)
                    .foregroundStyle(PLTheme.mutedInk)

                if let buyInValidationMessage {
                    Text(buyInValidationMessage)
                        .font(.footnote)
                        .foregroundStyle(PLTheme.warning)
                }

                ForEach(Array(draft.selectedPlayerIDs).sorted(), id: \.self) { playerID in
                    HStack {
                        Text(model.player(for: playerID)?.name ?? "玩家")
                            .foregroundStyle(PLTheme.ink)
                        Spacer()
                        TextField("金额", text: Binding(
                            get: { openingBuyInText(for: playerID) },
                            set: { openingBuyInTexts[playerID] = $0 }
                        ))
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 120)
                    }
                }
            }
        }
    }

    private var confirmStep: some View {
        PLCard(title: "确认开始", subtitle: "检查一下，再进入 Live Session。") {
            VStack(alignment: .leading, spacing: 14) {
                summaryRow(title: "标题", value: draft.title.isEmpty ? "未命名牌局" : draft.title)
                summaryRow(title: "日期", value: draft.sessionDate.formatted(date: .abbreviated, time: .shortened))
                summaryRow(title: "人数", value: "\(draft.selectedPlayerIDs.count)")
                summaryRow(title: "共享买入", value: formatMoney(cents: draft.sharedOpeningBuyInCents))

                Divider().background(PLTheme.border)

                ForEach(Array(draft.selectedPlayerIDs).sorted(), id: \.self) { playerID in
                    HStack {
                        Text(model.player(for: playerID)?.name ?? "玩家")
                            .foregroundStyle(PLTheme.ink)
                        Spacer()
                        Text(formatMoney(cents: draft.openingBuyIns[playerID] ?? draft.sharedOpeningBuyInCents))
                            .font(.system(.body, design: .monospaced).weight(.semibold))
                            .foregroundStyle(PLTheme.ink)
                            .monospacedDigit()
                    }
                }
            }
        }
    }

    private var canAdvance: Bool {
        switch step {
        case 0:
            return !draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case 1:
            return !draft.selectedPlayerIDs.isEmpty
        case 2:
            return buyInValidationMessage == nil
        default:
            return buyInValidationMessage == nil
        }
    }

    private func summaryRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(PLTheme.mutedInk)
            Spacer()
            Text(value)
                .foregroundStyle(PLTheme.ink)
        }
    }

    private var parsedSharedOpeningBuyInCents: Int? {
        guard let cents = MoneyParser.cents(from: sharedOpeningBuyInText), cents > 0 else {
            return nil
        }
        return cents
    }

    private var buyInValidationMessage: String? {
        guard !draft.selectedPlayerIDs.isEmpty else {
            return "至少选择一位玩家后再设置买入。"
        }

        guard parsedSharedOpeningBuyInCents != nil else {
            return "共享开局买入必须是大于 0 的有效金额。"
        }

        for playerID in draft.selectedPlayerIDs.sorted(by: { $0.uuidString < $1.uuidString }) {
            guard let cents = parsedOpeningBuyInCents(for: playerID), cents > 0 else {
                let playerName = model.player(for: playerID)?.name ?? "玩家"
                return "\(playerName) 的开局买入无效。"
            }
        }

        return nil
    }

    private func parsedOpeningBuyInCents(for playerID: UUID) -> Int? {
        guard let cents = MoneyParser.cents(from: openingBuyInText(for: playerID)), cents > 0 else {
            return nil
        }
        return cents
    }

    private func openingBuyInText(for playerID: UUID) -> String {
        openingBuyInTexts[playerID] ?? formatEditableAmount(cents: draft.openingBuyIns[playerID] ?? draft.sharedOpeningBuyInCents)
    }

    private func toggleSelection(for playerID: UUID) {
        if draft.selectedPlayerIDs.contains(playerID) {
            draft.selectedPlayerIDs.remove(playerID)
            draft.openingBuyIns[playerID] = nil
            openingBuyInTexts[playerID] = nil
        } else {
            let openingBuyIn = parsedSharedOpeningBuyInCents ?? draft.sharedOpeningBuyInCents
            draft.selectedPlayerIDs.insert(playerID)
            draft.openingBuyIns[playerID] = openingBuyIn
            openingBuyInTexts[playerID] = formatEditableAmount(cents: openingBuyIn)
        }
    }

    private func bootstrapBuyInInputs() {
        sharedOpeningBuyInText = formatEditableAmount(cents: draft.sharedOpeningBuyInCents)
        for playerID in draft.selectedPlayerIDs {
            if openingBuyInTexts[playerID] == nil {
                let openingBuyIn = draft.openingBuyIns[playerID] ?? draft.sharedOpeningBuyInCents
                openingBuyInTexts[playerID] = formatEditableAmount(cents: openingBuyIn)
            }
        }
    }

    private func syncBuyInDraft() {
        if let sharedCents = parsedSharedOpeningBuyInCents {
            draft.sharedOpeningBuyInCents = sharedCents
        }

        for playerID in draft.selectedPlayerIDs {
            if let cents = parsedOpeningBuyInCents(for: playerID) {
                draft.openingBuyIns[playerID] = cents
            }
        }
    }
}
