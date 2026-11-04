import Foundation
import React

@objc(FamilyHubTestSupport)
class FamilyHubTestSupport: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }
  @objc func control(_ command: String, raw: String,
                     resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask,
                                             appropriateFor: nil, create: true)
      let folder = root.appendingPathComponent("familyhub", isDirectory: true)
      let report = root.appendingPathComponent("familyhub-test-report.json")
      let data = try JSONSerialization.jsonObject(with: Data(raw.utf8)) as? [String: Any] ?? [:]
      switch command {
      case "reset":
        guard Bundle.main.bundleIdentifier?.hasSuffix(".nativetest") == true else { throw NSError(domain: "Fixture", code: 1) }
        if FileManager.default.fileExists(atPath: folder.path) { try FileManager.default.removeItem(at: folder) }
        resolve(nil)
      case "writeFile", "removeFile":
        let allowed = ["installation.json", "family_hub_v2.db", "family_hub_v2.db-wal", "family_hub_v2.db-shm", "family_hub_v2.db-journal"]
        guard let name = data["name"] as? String, allowed.contains(name) else { throw NSError(domain: "Fixture", code: 2) }
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let file = folder.appendingPathComponent(name)
        if command == "writeFile" { try Data((data["value"] as? String ?? "").utf8).write(to: file) }
        else if FileManager.default.fileExists(atPath: file.path) { try FileManager.default.removeItem(at: file) }
        resolve(nil)
      case "report": try Data(raw.utf8).write(to: report, options: .atomic); resolve(nil)
      case "readReport": resolve(FileManager.default.fileExists(atPath: report.path) ? try String(contentsOf: report, encoding: .utf8) : nil)
      default: throw NSError(domain: "Fixture", code: 3)
      }
    } catch { reject("SYNTHETIC_TEST_FAILURE", "Synthetic test operation failed", nil) }
  }
}
