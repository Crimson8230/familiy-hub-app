export interface NativeTestContext {
  // Implemented by the test-only runtime; all operations use the installed test app's real storage.
  storageScenario(name: string): Promise<void>;
  legacyScenario(name: string): Promise<void>;
}
export interface NativeCase { name: string; run(context: NativeTestContext): Promise<void> }
