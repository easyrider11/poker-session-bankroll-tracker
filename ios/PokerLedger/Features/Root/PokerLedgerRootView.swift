import SwiftUI
import Observation

struct PokerLedgerRootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model

        TabView(selection: $model.selectedTab) {
            NavigationStack {
                SessionHubView()
            }
            .tabItem {
                Label("牌局", systemImage: "suit.spade.fill")
            }
            .tag(AppTab.sessions)

            NavigationStack {
                HistoryView()
            }
            .tabItem {
                Label("历史", systemImage: "clock.arrow.circlepath")
            }
            .tag(AppTab.history)

            NavigationStack {
                PlayersView()
            }
            .tabItem {
                Label("玩家", systemImage: "person.3.fill")
            }
            .tag(AppTab.players)
        }
        .tint(PLTheme.backgroundDeep)
        .sheet(isPresented: $model.isPresentingNewSessionWizard) {
            NewSessionWizardView()
                .presentationDetents([.large])
                .presentationCornerRadius(24)
        }
        .sheet(item: $model.selectedAmountEditor) { context in
            AmountEntrySheet(context: context)
                .presentationDetents([.height(420), .large])
                .presentationCornerRadius(24)
        }
        .alert(item: $model.activeAlert) { alert in
            Alert(
                title: Text(alert.title),
                message: Text(alert.message),
                dismissButton: .default(Text("知道了"))
            )
        }
    }
}
