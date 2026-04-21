import Foundation
import Testing

@testable import PokerLedgerCore

@Test
func archiveStoreRoundTripsArchiveToDisk() throws {
    let tempDirectory = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString, isDirectory: true)
    try FileManager.default.createDirectory(at: tempDirectory, withIntermediateDirectories: true)

    let store = ArchiveStore(fileURL: tempDirectory.appendingPathComponent("archive.json"))
    let archive = SampleData.demoArchive(referenceDate: Date(timeIntervalSince1970: 1_713_564_800))

    try store.save(archive)
    let loaded = try store.load()

    #expect(loaded == archive)
}
