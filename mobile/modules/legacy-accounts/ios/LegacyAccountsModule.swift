import ExpoModulesCore
public class LegacyAccountsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LegacyAccounts")
    AsyncFunction("exists") { false }
    AsyncFunction("snapshot") { () -> String? in nil }
    AsyncFunction("removeDatabase") { }
    AsyncFunction("removeKey") { }
  }
}
