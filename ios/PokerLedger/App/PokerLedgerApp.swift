import SwiftUI

@main
struct PokerLedgerApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            PokerLedgerRootView()
                .environment(model)
        }
    }
}
