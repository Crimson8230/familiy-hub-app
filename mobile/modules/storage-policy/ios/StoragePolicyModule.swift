import ExpoModulesCore
import Foundation
import Darwin

public class StoragePolicyModule: Module {
  private func directory() throws -> URL {
    let root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask,
                                           appropriateFor: nil, create: true)
    var folder = root.appendingPathComponent("familyhub", isDirectory: true)
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    var policy = URLResourceValues()
    policy.isExcludedFromBackup = true
    try folder.setResourceValues(policy)
    guard try folder.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true else {
      throw NSError(domain: "FamilyHubStorage", code: 1)
    }
    return folder
  }
  private func protectFiles() throws {
    let folder = try directory()
    for var item in try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil) {
      var policy = URLResourceValues()
      policy.isExcludedFromBackup = true
      try item.setResourceValues(policy)
      guard try item.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true else {
        throw NSError(domain: "FamilyHubStorage", code: 1)
      }
    }
  }
  public func definition() -> ModuleDefinition {
    Name("StoragePolicy")
    AsyncFunction("inspect") { () throws -> [String: Any] in
      let folder = try self.directory()
      let target = folder.appendingPathComponent("family_hub_v2.db")
      let exists = FileManager.default.fileExists(atPath: target.path)
      let marker = folder.appendingPathComponent("installation.json")
      let markerValue: Any
      if FileManager.default.fileExists(atPath: marker.path) {
        markerValue = try String(contentsOf: marker, encoding: .utf8)
      } else { markerValue = NSNull() }
      let orphaned = !exists && ["-wal", "-shm", "-journal"].contains {
        FileManager.default.fileExists(atPath: target.path + $0)
      }
      return ["directory": folder.path, "database": exists, "orphanedFiles": orphaned, "marker": markerValue]
    }
    AsyncFunction("writeMarker") { (value: String) throws in
      guard value.utf8.count < 2048 else { throw NSError(domain: "FamilyHubStorage", code: 2) }
      let folder = try self.directory()
      let marker = folder.appendingPathComponent("installation.json")
      try Data(value.utf8).write(to: marker, options: [.atomic, .completeFileProtection])
      let handle = try FileHandle(forWritingTo: marker)
      defer { try? handle.close() }
      try handle.synchronize()
      let descriptor = Darwin.open(folder.path, O_RDONLY)
      guard descriptor >= 0 else { throw NSError(domain: "FamilyHubStorage", code: 3) }
      defer { Darwin.close(descriptor) }
      guard Darwin.fsync(descriptor) == 0 else { throw NSError(domain: "FamilyHubStorage", code: 3) }
      try self.protectFiles()
    }
    AsyncFunction("protect") { () throws in try self.protectFiles() }
  }
}
