import Foundation

public enum MoneyParser {
    public static func cents(from value: String) -> Int? {
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return nil }
        guard normalized.range(of: #"^\d+(\.\d{1,2})?$"#, options: .regularExpression) != nil else {
            return nil
        }

        let pieces = normalized.split(separator: ".", omittingEmptySubsequences: false)
        guard let whole = Int(pieces[0]) else { return nil }
        let fraction = pieces.count > 1 ? String(pieces[1]).padding(toLength: 2, withPad: "0", startingAt: 0) : "00"
        guard let cents = Int(String(fraction.prefix(2))) else { return nil }
        return whole * 100 + cents
    }
}

public enum MoneyFormatter {
    private static let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.locale = Locale(identifier: "en_US")
        return formatter
    }()

    public static func currency(from cents: Int) -> String {
        let amount = NSDecimalNumber(value: Double(cents) / 100.0)
        return formatter.string(from: amount) ?? "$0.00"
    }

    public static func signedCurrency(from cents: Int) -> String {
        let absolute = currency(from: abs(cents))
        if cents > 0 { return "+\(absolute)" }
        if cents < 0 { return "-\(absolute)" }
        return absolute
    }
}
