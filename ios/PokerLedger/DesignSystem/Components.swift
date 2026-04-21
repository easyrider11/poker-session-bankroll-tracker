import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

struct PLCard<Content: View>: View {
    let title: String?
    let subtitle: String?
    let content: Content

    init(title: String? = nil, subtitle: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let title {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(PLTheme.headlineFont)
                        .foregroundStyle(PLTheme.ink)
                    if let subtitle {
                        Text(subtitle)
                            .font(.footnote)
                            .foregroundStyle(PLTheme.mutedInk)
                    }
                }
            }

            content
        }
        .padding(16)
        .plCardBackground()
    }
}

struct MetricTileValue: Identifiable, Hashable {
    enum Tone {
        case neutral
        case positive
        case negative
    }

    let id = UUID()
    let title: String
    let value: String
    let subtitle: String
    var tone: Tone = .neutral
}

struct PLMetricTile: View {
    let metric: MetricTileValue

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(metric.title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(PLTheme.mutedInk)
                .textCase(.uppercase)
                .tracking(0.6)

            Text(metric.value)
                .font(PLTheme.largeMonoFont)
                .foregroundStyle(metricTone)
                .monospacedDigit()

            Text(metric.subtitle)
                .font(.caption)
                .foregroundStyle(PLTheme.mutedInk)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .plCardBackground()
    }

    private var metricTone: Color {
        switch metric.tone {
        case .neutral: return PLTheme.ink
        case .positive: return PLTheme.positive
        case .negative: return PLTheme.negative
        }
    }
}

struct StatusPill: View {
    let text: String
    var tone: Color = PLTheme.backgroundDeep

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(tone)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(Capsule().fill(tone.opacity(0.12)))
            .overlay(Capsule().stroke(tone.opacity(0.18), lineWidth: 1))
    }
}

struct ActionButton: View {
    let title: String
    let systemImage: String
    var role: ButtonRole? = nil
    var tint: Color = PLTheme.backgroundDeep
    let action: () -> Void

    var body: some View {
        Button(role: role, action: action) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(tint)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(tint.opacity(0.10))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(tint.opacity(0.18), lineWidth: 1)
                )
        }
    }
}

struct PrimaryActionBar: View {
    let primaryTitle: String
    var secondaryTitle: String?
    let primaryAction: () -> Void
    var secondaryAction: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 12) {
            if let secondaryTitle, let secondaryAction {
                Button(secondaryTitle, action: secondaryAction)
                    .buttonStyle(PLGhostButtonStyle())
            }

            Button(primaryTitle, action: primaryAction)
                .buttonStyle(PLPrimaryButtonStyle())
        }
    }
}

struct PLPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(PLTheme.backgroundDeep.opacity(configuration.isPressed ? 0.82 : 1))
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct PLGhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(PLTheme.backgroundDeep)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white.opacity(configuration.isPressed ? 0.68 : 0.88))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(PLTheme.border, lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct EmptyCardState: View {
    let title: String
    let subtitle: String
    let actionTitle: String?
    let action: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(PLTheme.headlineFont)
                .foregroundStyle(PLTheme.surface)
            Text(subtitle)
                .font(.callout)
                .foregroundStyle(PLTheme.surface.opacity(0.78))
                .fixedSize(horizontal: false, vertical: true)

            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(PLPrimaryButtonStyle())
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous)
                .fill(PLTheme.backgroundAlt.opacity(0.92))
        )
        .overlay(
            RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous)
                .stroke(PLTheme.border, lineWidth: 1)
        )
    }
}

struct SectionHeader: View {
    let title: String
    let subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(PLTheme.headlineFont)
                .foregroundStyle(PLTheme.surface)
            if let subtitle {
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(PLTheme.surface.opacity(0.72))
            }
        }
    }
}

struct AmountEntryContext: Identifiable, Hashable {
    enum Mode: Hashable {
        case cashIn
        case cashOut
    }

    let id = UUID()
    let seatID: UUID
    let playerName: String
    let mode: Mode
    var amountCents: Int
    var note: String = ""
}

struct AmountEntrySheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var draft: AmountEntryContext
    @State private var amountText: String

    init(context: AmountEntryContext) {
        _draft = State(initialValue: context)
        _amountText = State(initialValue: formatEditableAmount(cents: context.amountCents))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                PLCard(title: draft.playerName, subtitle: draft.mode == .cashIn ? "录入买入金额" : "录入出池金额") {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(parsedAmountCents.map(formatMoney(cents:)) ?? "输入有效金额")
                            .font(.system(size: 34, weight: .bold, design: .monospaced))
                            .foregroundStyle(amountTone)
                            .monospacedDigit()

                        TextField("任意金额，例如 125 或 125.50", text: $amountText)
                            .keyboardType(.decimalPad)
                            .textFieldStyle(.roundedBorder)
                            .onChange(of: amountText) { _, newValue in
                                if let cents = MoneyParser.cents(from: newValue) {
                                    draft.amountCents = cents
                                }
                            }

                        HStack(spacing: 10) {
                            Button("500") { applyPreset(50000) }
                                .buttonStyle(PLGhostButtonStyle())
                            Button("1,000") { applyPreset(100000) }
                                .buttonStyle(PLGhostButtonStyle())
                            Button("2,000") { applyPreset(200000) }
                                .buttonStyle(PLGhostButtonStyle())
                        }

                        Text(amountHelperText)
                            .font(.footnote)
                            .foregroundStyle(parsedAmountCents == nil ? PLTheme.warning : PLTheme.mutedInk)

                        TextField("备注", text: $draft.note, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                Spacer(minLength: 0)
            }
            .padding()
            .plShellBackground()
            .navigationTitle("录入金额")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                        .foregroundStyle(.white)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        guard let parsedAmountCents else {
                            return
                        }
                        if model.appendEvent(
                            to: draft.seatID,
                            amountCents: parsedAmountCents,
                            type: draft.mode == .cashIn ? .cashIn : .cashOut,
                            note: draft.note.isEmpty ? nil : draft.note,
                            origin: draft.mode == .cashIn ? .rebuy : .cashOut
                        ) {
                            dismiss()
                        }
                    }
                    .foregroundStyle(.white)
                    .disabled(parsedAmountCents == nil)
                }
            }
        }
    }

    private var parsedAmountCents: Int? {
        guard let cents = MoneyParser.cents(from: amountText), cents > 0 else {
            return nil
        }
        return cents
    }

    private var amountTone: Color {
        guard parsedAmountCents != nil else {
            return PLTheme.warning
        }
        return draft.mode == .cashIn ? PLTheme.positive : PLTheme.negative
    }

    private var amountHelperText: String {
        parsedAmountCents == nil
            ? "请输入大于 0 的金额，支持两位小数。"
            : "支持任意金额，保存后会写入本局的现金流水。"
    }

    private func applyPreset(_ cents: Int) {
        draft.amountCents = cents
        amountText = formatEditableAmount(cents: cents)
    }
}
