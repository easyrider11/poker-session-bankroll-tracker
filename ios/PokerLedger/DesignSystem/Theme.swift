import Foundation
import SwiftUI
#if canImport(PokerLedgerCore)
import PokerLedgerCore
#endif

enum PLTheme {
    static let background = Color(hex: 0x0E241B)
    static let backgroundAlt = Color(hex: 0x163328)
    static let backgroundDeep = Color(hex: 0x1E4A39)
    static let surface = Color(hex: 0xF5F3EC)
    static let surfaceAlt = Color(hex: 0xE8E6DD)
    static let ink = Color(hex: 0x111111)
    static let mutedInk = Color(hex: 0x4D4A45)
    static let border = Color.white.opacity(0.11)
    static let positive = Color(hex: 0x72C38D)
    static let negative = Color(hex: 0x8B3E35)
    static let warning = Color(hex: 0xC9A84D)
    static let cardShadow = Color.black.opacity(0.22)

    static let radius: CGFloat = 22
    static let radiusSmall: CGFloat = 16

    static let titleFont = Font.system(.title, design: .rounded).weight(.bold)
    static let headlineFont = Font.system(.headline, design: .rounded).weight(.semibold)
    static let bodyFont = Font.system(.body, design: .rounded)
    static let monoFont = Font.system(.body, design: .monospaced).weight(.semibold)
    static let largeMonoFont = Font.system(.title2, design: .monospaced).weight(.bold)
}

extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

extension View {
    func plCardBackground() -> some View {
        self
            .background(
                RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous)
                    .fill(PLTheme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: PLTheme.radius, style: .continuous)
                    .stroke(PLTheme.border, lineWidth: 1)
            )
            .shadow(color: PLTheme.cardShadow, radius: 18, x: 0, y: 12)
    }

    func plShellBackground() -> some View {
        self
            .background(
                LinearGradient(
                    colors: [PLTheme.background, PLTheme.backgroundAlt, PLTheme.backgroundDeep],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    func plMonospacedAmount() -> some View {
        self.monospacedDigit()
    }
}

func formatMoney(cents: Int) -> String {
    #if canImport(PokerLedgerCore)
    MoneyFormatter.currency(from: cents)
    #else
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    formatter.minimumFractionDigits = 2
    formatter.maximumFractionDigits = 2
    let dollars = Double(cents) / 100.0
    return formatter.string(from: NSNumber(value: dollars)) ?? "$0.00"
    #endif
}

func formatSignedMoney(cents: Int) -> String {
    #if canImport(PokerLedgerCore)
    MoneyFormatter.signedCurrency(from: cents)
    #else
    let value = formatMoney(cents: abs(cents))
    if cents > 0 {
        return "+\(value)"
    }
    if cents < 0 {
        return "-\(value)"
    }
    return value
    #endif
}

func formatEditableAmount(cents: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.minimumFractionDigits = 0
    formatter.maximumFractionDigits = 2
    let amount = Double(cents) / 100.0
    return formatter.string(from: NSNumber(value: amount)) ?? String(format: "%.2f", amount)
}

func profitTone(for amount: Int) -> Color {
    amount >= 0 ? PLTheme.positive : PLTheme.negative
}

func balanceTone(for delta: Int) -> Color {
    delta == 0 ? PLTheme.positive : PLTheme.warning
}

struct AmountBadgeStyle: ViewModifier {
    let tone: Color

    func body(content: Content) -> some View {
        content
            .font(PLTheme.largeMonoFont)
            .foregroundStyle(tone)
            .monospacedDigit()
    }
}

extension Text {
    func plAmountStyle(tone: Color = PLTheme.ink) -> some View {
        modifier(AmountBadgeStyle(tone: tone))
    }
}
