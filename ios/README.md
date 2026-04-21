# PokerLedger iOS

Native SwiftUI poker bankroll tracker with a local-first core package and an XcodeGen project spec.

## Structure

- `PokerLedgerCore/`: pure Swift domain models, session workflow, JSON archive storage, sample data, and a verification runner
- `PokerLedger/`: SwiftUI iPhone app for sessions, history, and players
- `project.yml`: XcodeGen spec that generates `PokerLedger.xcodeproj`

## Local Verification

This machine does not have a full `Xcode.app`, so the reliable checks here are:

```bash
cd ios
xcodegen generate

cd PokerLedgerCore
swift run --build-path /tmp/pokerledgercore-build-main PokerLedgerCoreVerification
```

## Toolchain Limitation

`swift test` is not usable in the current environment because the active developer directory is Command Line Tools only and `XCTest` is unavailable. Test source files are still included under `PokerLedgerCore/Tests/` for a future Xcode-capable machine, while current verification uses the executable runner.

## Open In Xcode

After generating the project:

```bash
open ios/PokerLedger.xcodeproj
```

Then in Xcode:

1. Select a signing team.
2. Adjust the bundle identifier if needed.
3. Run on a simulator or device.
4. Archive and upload to TestFlight once signing is valid.

## Shipping Requirements

For simulator builds, real-device deployment, TestFlight, or App Store upload, you still need:

- full `Xcode.app`
- iOS SDK and Simulator
- Apple Developer account and signing setup
- production bundle identifier and App Store Connect app record
- App Store screenshots and listing copy

This repo now includes a ready-to-use `Assets.xcassets/AppIcon.appiconset` and version/build placeholders wired through build settings.
