import Testing

@testable import PokerLedgerCore

@Test
func parsesValidMoneyAmountsIntoCents() {
    #expect(MoneyParser.cents(from: "100") == 10_000)
    #expect(MoneyParser.cents(from: "100.5") == 10_050)
    #expect(MoneyParser.cents(from: "0.99") == 99)
}

@Test
func rejectsInvalidMoneyAmounts() {
    #expect(MoneyParser.cents(from: "") == nil)
    #expect(MoneyParser.cents(from: "-1") == nil)
    #expect(MoneyParser.cents(from: "12.345") == nil)
    #expect(MoneyParser.cents(from: "abc") == nil)
}
