// swift-tools-version: 5.10

import PackageDescription

let package = Package(
    name: "PokerLedgerCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "PokerLedgerCore",
            targets: ["PokerLedgerCore"]
        ),
        .executable(
            name: "PokerLedgerCoreVerification",
            targets: ["PokerLedgerCoreVerification"]
        ),
    ],
    targets: [
        .target(
            name: "PokerLedgerCore"
        ),
        .executableTarget(
            name: "PokerLedgerCoreVerification",
            dependencies: ["PokerLedgerCore"]
        ),
    ]
)
