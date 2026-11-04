# Family Hub mobile

Expo SDK 58 / React Native 0.88 / TypeScript for Android and iOS.
Current status: secure-storage foundation and initial account creation/list UI implemented
(T001–T031, with the deferred iOS foundation check T087 now passed).
Android foundation checkpoint T023 passed; account creation and minimal list UI are
implemented. Account deletion and full story/preview acceptance are pending.
iOS foundation check T087 passed on an iOS 27.2 Simulator: 31 native scenarios,
7 process restarts and the intentional failure probe. T032 is next;
full story/platform/release acceptance stays gated by the remaining tasks.
As of 2026-11-04, the legacy read-only snapshot defect is fixed and all 34 Android
TS scenarios and all 7 Kotlin tests pass together in the complete Android run,
including both failure probes and 10 process restarts.
See `../specs/001-registerkonten-verwalten/verification-expo.md` for executed checks and blockers.
The original Kotlin application remains under `../app/` until all replacement gates pass.

## Development

Use Node 22 (`nvm use`), then `npm ci` and `npm run typecheck`.
`npm test` runs component/unit suites only. Native integration requires a dedicated binary;
Expo Go and Jest mocks are not evidence for SQLCipher or platform key storage.
`npm run test:host` checks host result validation. `npm run test:native -- --platform android`
(or `ios`) builds/runs the dedicated test host; select a device with `--device SERIAL` or UDID.
The Android runner requires an online, isolated device; iOS currently uses a booted Simulator
on macOS. Native test reports require all expected cases, not merely a nonempty result.
Android builds target the selected device's primary ABI. Full runs assemble the
host and instrumentation APK once, compare their SHA-256 hashes with installed
APKs, and install only changed/missing binaries. Kotlin tests and their failure
probe run directly through AndroidJUnitRunner over ADB; the APKs remain installed.
An installation prompt may still appear when a binary actually changes.

For normal TypeScript iteration, use the existing test app without Gradle,
prebuild, or installation:

```bash
npm run test:native -- --platform android --device SERIAL --installed
npm run test:native -- --platform android --device SERIAL --installed --case legacy-formats-1-2-3
```

`--case` accepts an exact name from `tests/native/scenarios.json` and requires
`--installed`. Selection survives real process restarts. These are diagnostic
runs: reports use `android-diagnostic-*.json`, mark `diagnostic: true` and
`complete: false`, and do not replace full Android/iOS acceptance. Exit 0 means
only that the selected diagnostic scope passed. Secrets and raw errors are excluded.
Keep the phone connected and unlocked; JS is served by Metro.

After native dependencies, plugins or profile configuration change, run the
normal command to regenerate/build/install. `--reuse-native-project` skips only
project generation for an already generated native-test project; it still
builds and executes all platform test groups. On iOS it checks the test bundle ID,
test harness and SQLCipher setting before reuse. Do not use it after native config changes.

Select a profile using `FAMILYHUB_BUILD_PROFILE`: `development` (default),
`native-test`, `preview`, or `upgrade-test`. EAS profiles set it explicitly.
For example: `FAMILYHUB_BUILD_PROFILE=development npx expo run:android`.
A native dependency/configuration or profile change requires `npx expo prebuild --no-install`
with the same profile followed by a new native build.
Preview embeds its JS bundle so offline startup does not depend on Metro.

The standalone account-creation flow and platform execution instructions are in
[.maestro/README.md](.maestro/README.md). It requires a fresh, isolated preview
installation and disabled device networking; it never clears existing app data.
Run the main `create-account.yaml` file, not the parameterized helper directory.
For Android automation use `npm run test:preview:android -- --device emulator-5554`;
the starter rejects physical devices before contacting ADB and checks emulator
identity/readiness and offline settings. The personal phone is reserved for manual
preview testing. No automated native/Maestro runs on that phone are authorized.

For manual phone checks, launch the ARM64 preview normally without USB/debugging.
Check field/button readability, school selection, keyboard and scrolling, saving
synthetic credentials, duplicate rejection, and persistence after closing/reopening
offline. Creation and a minimal list are available; deletion and full overview
behavior are still pending. Record steps, expected/actual behavior and app/OS
versions without real credentials. No automated test tooling is needed on the phone.

Local Android requires a JDK and Android SDK. Local iOS requires macOS/Xcode.
Store submission and EAS account setup are outside this implementation stage.

For local iOS tests, finish Xcode's first-launch setup, install an iOS Simulator
runtime, and boot a Simulator. Use Node 22 and CocoaPods. If the active developer
directory still points to Command Line Tools, set
`DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for the test command.
The iOS host builds a generic Simulator binary, installs it on the selected UDID
with `simctl`, and passes the Metro URL directly through Expo's `--initialUrl` argument.
It does not require macOS System Events automation access or an interactive
URL-opening confirmation. Build outputs remain under `tests/artifacts/native/`.

## Legacy fixture

`bash tests/tools/prepare-legacy-fixtures.sh --verify-only` checks the frozen original sources.
For APK builds supply JDK 21, SDK 36/Build Tools 36.1.0 and an external synthetic-test
keystore through the `FAMILYHUB_TEST_*` variables named in the script. Never use production
signing credentials or real register data for fixture preparation.

The active design and checks are under `../specs/001-registerkonten-verwalten/`.

## Initial account creation (2026-11-04)

The start route lists only ID/child/school summaries. Adding an account validates
required fields and the school allowlist, preserves credential whitespace, and
uses an exclusive encrypted transaction. Duplicate identities are rejected;
uncertain commit results are read back before success is reported. Form inputs
stay local and are cleared on save/cancel or discarded when leaving the screen.

Typecheck and 48 unit/component tests pass. The installed Android native test app
passes 44 TS scenarios (10 new creation scenarios), its failure probe and 12 real
process restarts. This diagnostic does not replace the earlier full Android
foundation acceptance or the outstanding iOS/standalone offline-preview checks.
T087 now passes on iOS; T032 is next. No full US1 acceptance is claimed.
