# Expo implementation verification

Date: 2026-10-24. Progress: implementation of T001–T022; mandatory native checkpoint
T023 is open. This is not a release approval or a completed account-management feature.

## Toolchain and setup

- Official Node 22.22.0 archive checked against the official SHA-256 and extracted
  to `/tmp/familyhub-tools/`; no system Node installation was changed.
- Existing JBR 21 and Android SDK located. Required Gradle/Android build dependencies
  were downloaded with approval. The npm and Gradle task caches are in `/tmp/`.
- Expo 58.0.19, React/React DOM 19.3.0, React Native 0.88.0 and expo-sqlite 58.0.14
  installed; package-lock dependencies match package.json.
- TypeScript strict check passed. Expo Doctor: 20/20 checks passed.
- Expo dependency check passed against the installed SDK dependency map, using the
  tool's offline fallback. The Doctor check also completed online.
- All four configuration profiles evaluated; expected IDs, disabled Android backup,
  SQLCipher on both platforms. Android and iOS projects generated successfully.

## Implemented foundation

- SecureStore key record and installation marker share a versioned installation ID.
  Marker-before-key initialization and fail-closed recovery rules are implemented.
- SQLCipher adapter keys each fresh connection before data access/transactions,
  disables SQLite inspector registration, serializes operations and sanitizes errors.
- Versioned SQLite schema and rollback-based migration, preserved legacy account IDs,
  strict input validation, verified target reopening and resumable old-data cleanup.
- Android Keystore decoder retains old credential formats 1–3 without key generation.
  Small Swift/Android modules implement storage policy and old-data access.
- Dedicated test entry, real test-host orchestration and profile-gated native test
  support; regular preview bundles do not include test scenario/probe markers.
- Storage loading/error/retry provider is integrated. The account creation/list/delete
  stories T024–T049 are not started because T023 is the required dependency gate.

## Executed checks

- 22 Jest unit tests passed: bootstrap decisions, marker validation and legacy input
  validation. Initial security-boundary tests were observed failing before implementation.
- 4 host orchestration tests passed: required groups, failure/skipped/empty groups,
  normal results and exact expected case counts.
- Kotlin legacy fixture source checksums verified against the pinned manifest.
- Frozen legacy application and instrumentation APK built successfully using the
  retained Gradle 8.14.3 wrapper: 69 tasks, BUILD SUCCESSFUL in 4m42s. Only the
  versioned synthetic seeder/signing init script are additions; no private key committed.
- Both new Android storage modules compiled successfully: Gradle 9.4.1,
  69 tasks, BUILD SUCCESSFUL in 7m21s.
- Android native-test host including Kotlin instrumentation compiled successfully:
  `:app:compileDebugAndroidTestKotlin`, 383 tasks, BUILD SUCCESSFUL in 5m14s.
  This is compilation, not instrumented device execution or an assembled Expo APK.
- Metro/Hermes exports succeeded for the Android test entry, Android preview and
  iOS preview. Preview bundles were checked for absence of native test scenario/probe
  markers. Preview native project generation excludes Android test source injection
  and iOS test support files. An iOS JS export is not an Xcode build.
- `git diff --check` passed. Historical Kotlin tasks and original app sources remain.

## T023 execution blockers

No physical Android phone is connected. The VM exposes no `/dev/kvm`; the emulator
acceleration check reports that vmx/svm CPU support is unavailable. The configured
API-37 emulator was started headlessly with software emulation, but remained ADB
offline through repeated checks. It was shut down after this unsuccessful attempt.

The iOS native test command was attempted and correctly exited nonzero with:
`iOS native tests require macOS, Xcode and an iOS Simulator`.
This Linux host cannot compile Swift/iOS binaries or run iOS Simulator tests.

No device SQLCipher/Keystore/Keychain roundtrip, native crash-recovery suite,
Android upgrade, offline account-UI, accessibility, performance or person-based
usage acceptance has passed. The defined native suites require 21 shared storage
cases, 13 additional Android migration cases and 5 Kotlin instrumented tests.
They are not reported as executed. T023 stays open; later story phases remain gated.
Provide an isolated Android device/emulator and a macOS/iOS test environment to
continue the mandatory platform checkpoint. Do not remove the original Kotlin app.

## Dependency audit limitation

npm audit reported upstream development-toolchain findings in node-forge and zod
through Expo CLI (5 high package entries including affected parents). No forced
major downgrade/override was applied. Compatible upstream fixes must be reassessed
before release; Expo Doctor is not vulnerability-audit clearance.


## Implementation resume — 2026-10-25

- The requirements checklist passed: 16 checked, zero unchecked. Existing ignore
  rules cover Expo/native build outputs, dependencies, local environment files,
  signing credentials and test artifacts; no ignore changes were needed.
- T023 remains the first unfinished sequential task. The convergence tasks retain
  the original dependencies; they do not waive the native foundation checkpoint.
- ADB was retried outside the sandbox after the sandbox prevented its listener
  from starting. The server started, but the attached Android USB device was
  listed as `no permissions`; ADB reports that the current user is not in the
  `plugdev` group. No instrumented tests could run. Device identifiers are omitted.
  Configure host USB/udev access for this user, reconnect the isolated test phone
  and verify that `adb devices -l` lists it as `device` before retrying T023.
  No user-group or system USB-rule changes were made by this run.
- The Android emulator acceleration check reports `KVM requires a CPU that
  supports vmx or svm`; `/dev/kvm` is absent. The previously unsuccessful software
  emulator was not restarted.
- The host is Linux and has no `xcrun`; iOS native verification still requires a
  macOS/Xcode environment with an available simulator or configured device.
- Node is not on PATH and the previous `/tmp/familyhub-tools/` installation no
  longer exists. Node 22.13+ (22 LTS) must be restored to run the existing host
  runner. No Jest, TypeScript, native build or native runtime pass is claimed for
  this resume attempt; earlier results above remain historical.
- Execution stopped at the required T023 checkpoint. No task was newly completed,
  no task checkbox or checklist was changed, and the original Kotlin app remains.
  After restoring Node and device access, run the documented Android and iOS
  native commands, fix any failures and collect both platform reports before
  starting the dependent account stories. T023 and T060 remain unchecked.


## Second implementation resume — 2026-10-25

- Requirements checklist remains 16/16 checked. No extension configuration exists;
  pre-/post-implementation hooks are not registered.
- Restored official Node 22.22.0 to
  `/tmp/familyhub-tools/node-v22.22.0-linux-x64/`, checking the downloaded archive
  against the official release SHA-256. This supersedes the missing-Node blocker
  in the preceding resume entry; the temporary installation is not durable.
- Ran `node --test tests/tools/nativeTestOrchestration.test.mjs` from `mobile/`:
  exit 0, one test-file subtest passed. Its existing result-validation assertions
  passed. This is host validation, not native execution.
- ADB outside the sandbox now lists zero connected devices. Retried the Android
  native runner with the restored Node and Android SDK: exit 1,
  `Connect exactly one isolated Android test device or pass --device SERIAL`.
  The previous unauthorized device is no longer listed; successful USB access
  has not been demonstrated.
- Retried the iOS native runner: exit 1,
  `iOS native tests require macOS, Xcode and an iOS Simulator`.
- T023/T060 remain open. No application code or task/checklist markers changed.
  The sequential foundation gate prevents starting dependent story phases.

To resume Android on this host after connecting an isolated, authorized device:

```bash
cd mobile
export PATH=/tmp/familyhub-tools/node-v22.22.0-linux-x64/bin:$PATH
export ANDROID_HOME=/home/hanper/Android/Sdk
export JAVA_HOME=/home/hanper/.jdks/jbr-21.0.11
export PATH="$JAVA_HOME/bin:$PATH"
npm run test:native -- --platform android --device SERIAL
```

Replace SERIAL with the authorized device listed by ADB. Run the corresponding
`npm run test:native -- --platform ios --device UDID` in a configured macOS/Xcode
checkout, then collect both platform reports before completing the checkpoint.

## Physical Android retry: USB authorized, installation blocked (2026-10-25)

- Resumed T023 with Node 22.22.0, `JAVA_HOME=/home/hanper/.jdks/jbr-21.0.11`
  and `ANDROID_HOME=/home/hanper/Android/Sdk`. ADB access requires execution
  outside the agent sandbox. Device `1b274288` is authorized: M2101K6G, Android 13.
- Host orchestration check exited 0 again. Requirements checklist remains 16/16;
  no extension hook configuration is present.
- A previous compilation ended with Gradle client disconnection; the resumed run
  built both `android/app/build/outputs/apk/debug/app-debug.apk` and
  `android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`.
- `:app:connectedDebugAndroidTest` then failed installing the application:
  `INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`. Gradle reported
  **0 executed tests**, and exited nonzero after 13m 1s. This is an installation
  restriction, not a passed native test or a demonstrated storage defect.
- On the phone, allow USB app installation if the device exposes that setting,
  keep it unlocked and accept the installation prompts before retrying the
  documented command with `--device 1b274288`. Do not bypass device restrictions
  through ADB. No changes to production account data were requested.
- Android Kotlin/TS groups and failure probes remain unverified. iOS still
  requires macOS/Xcode and an iOS Simulator. T023/T060 remain open and dependent
  stories remain gated; no task checkbox was marked complete.

## Physical Android retry: first real Kotlin pass (2026-10-25)

- Direct installation of the existing test-host APK using `adb -s 1b274288
  install -r .../app-debug.apk` succeeded. The previous installation restriction
  was therefore resolved for that installation.
- Retried the complete `npm run test:native -- --platform android --device
  1b274288` command with the documented Java/Node/SDK environment.
- The regular `:app:connectedDebugAndroidTest` run successfully executed all
  **5 Kotlin tests on M2101K6G / Android 13**, with `BUILD SUCCESSFUL in 14m 21s`
  (619 tasks: 587 executed, 32 up-to-date).
- The subsequent intentional-failure probe invokes Gradle a second time and
  attempts installation again. This installation was rejected with
  `INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`; **0 probe tests**
  ran. Its 2m 25s Gradle failure is not the expected assertion failure. The host
  correctly exited nonzero (`Kotlin probe did not fail in the expected test`).
- TypeScript native tests and their failure probe were not reached. Keep the
  phone unlocked and approve installation prompts throughout both Gradle runs,
  including the second installation, before retrying.
- Sanitized partial evidence from observed command output is stored locally in
  `mobile/tests/artifacts/native/android-partial-summary.json`; it explicitly
  records `complete: false`. The second Gradle run overwrites its output folder,
  so this is not a retained XML report from the successful first run.
- T023/T060 remain open: Android failure probes/TS groups and iOS verification
  are still outstanding. No dependent story was started. No extension hooks
  are configured.

## Runner repairs and native TS execution (2026-10-25)

- Android Gradle invocations now use the selected device's validated primary ABI
  through `-PreactNativeArchitectures=arm64-v8a` on this phone. Regular Kotlin
  runs passed 5/5 in 6m 36s and 5m 49s, versus the previous 14m 21s multi-ABI run.
- The runner saves a sanitized `android-partial-summary.json` immediately after
  the normal Kotlin run, before the probe overwrites Gradle's XML output.
- The intentional Kotlin failure probe ran and failed in exactly its expected
  assertion. The installation restriction did not block these retries.
- Instrumentation removes its APKs: `run-as` confirmed the host package was
  absent after Gradle. The runner now reinstalls the host APK before TS testing;
  that installation succeeded in the subsequent full run.
- Metro with `--localhost` was reachable at `localhost:8089/status`, but IPv4
  `127.0.0.1:8089/status` refused connections on this machine. The Metro child
  now receives `--dns-result-order=ipv4first`, consistent with ADB reverse and
  host polling. Metro starts successfully, and its output is now visible.
- The corrected full run reached and passed the TS intentional-failure probe,
  then executed **15 normal TS scenarios successfully**. The first restart case,
  `crash-after-marker` (index 15), remained in `state: restart` until the host
  timed out. This is not a successful full Android run (34 scenarios required).
- Targeted investigation confirmed the test app was foregrounded. A manual
  force-stop and cold start with the retained report resumed successfully and
  advanced to `crash-after-key` (index 16, passed 16). This targeted result does
  not replace automated host restart verification.
- Added restart progress diagnostics and rejected null reports in the restart
  acknowledgement predicate. Those final changes pass syntax/host checks but
  have not yet passed another complete device run. Automatic restart handling
  remains an open T023 issue. The diagnostic Metro process was stopped.
- Syntax check, host orchestration check and `git diff --check` passed. No
  extension hooks exist. T023/T060 and dependent stories remain open; iOS still
  requires macOS/Xcode. The historical mobile README status is not release approval.

## Automated restart repaired; legacy scenario failure (2026-10-25)

This supersedes the earlier interpretation of the TS timeout as solely a restart
problem. Without stage diagnostics, normal device execution was observed while
the host had not reliably verified its intentional-failure request.

- Host now stops the Android process, waits for `pidof` to confirm termination,
  then writes the request and launches the app. The test component waits for an
  explicit `request` or `restart` record rather than starting without a request.
- `exec-in` request writing was replaced by `adb shell -T run-as ... tee` with
  readback verification. After fresh installation, the private `files/` directory
  must be created before writing a request while the process is stopped. The
  missing-directory write failed explicitly during investigation; `mkdir -p files`
  resolves it. Only fixed test-control data is transferred.
- Stage-specific timeouts and progress messages now distinguish Metro readiness,
  TS failure-probe completion and restart acknowledgement. Metro fetch requests
  have a 3s timeout. SIGINT/SIGTERM handlers clean up the owned Metro process;
  one leftover process from an earlier interrupted diagnostic run was identified
  by command line and terminated, without killing unrelated servers.
- Added Android `--reuse-native-project` for host/JS iteration after generation.
  It checks the generated native-test application ID and instrumentation harness;
  it still builds/runs both Gradle instrumentation passes. It does not validate
  freshness after native configuration/dependency changes and must not be used
  for those changes. Default runs continue to generate the native project.
- Latest device invocation: `npm run test:native -- --platform android --device
  1b274288 --reuse-native-project`, using the native-test project generated earlier
  in this session. **5/5 Kotlin tests passed; the Kotlin intentional-failure probe
  and the TS intentional-failure probe were both verified.**
- **All 21 shared storage scenarios passed**, including five actual automatic
  process restarts. Host output confirmed restarts for scenarios 16–20; no manual
  device restart was substituted in this run.
- The first Android legacy scenario then failed: index 21 (scenario 22),
  `legacy-formats-1-2-3`. App report: `state: complete`, `passed: 21`, `failed: 1`,
  `skipped: 0`. The host exited 1; the required 34 TS cases did not all pass.
  Failure location within fixture preparation versus import is not yet isolated.
- Sanitized evidence is saved in `mobile/tests/artifacts/native/android-partial-summary.json`
  with `complete: false`. The runner now persists partial TS results before
  rejecting a failed/incomplete suite, and names the failing scenario index in
  its error instead of only reporting a count mismatch. This final reporting
  adjustment passed host/syntax checks; it has not been run again on-device.
- T023/T060 remain open. Per the sequential-task failure gate, later stories were
  not started. iOS verification still requires macOS/Xcode; no iOS pass is claimed.
  No extension hook configuration is present.

## Persistent Android test host and focused diagnostics (2026-10-25)

User requested keeping development in the Linux VM while reducing repeated phone
installation prompts. The runner now separates full acceptance from installed-host
TypeScript diagnostics; T023 gates and iOS requirements remain unchanged.

- Full Android runs assemble both APKs once. Local SHA-256 hashes are compared
  with installed APK hashes via `pm path`/`sha256sum`; unchanged binaries are kept.
  Missing packages are distinguished from ADB transport failures.
- AndroidJUnitRunner is invoked directly over ADB for regular Kotlin tests and the
  intentional failure probe. Gradle's connected-test installation/cleanup cycle
  and the subsequent host reinstall were removed. Instrumentation terminal status,
  completed test counts, skips and errors are parsed and validated. New host tests
  cover successful, failed, skipped, missing, empty and crashed instrumentation.
- `--installed` runs TS against the existing debuggable Android test host with
  no prebuild, Gradle or installation. `--case NAME` requires this mode and selects
  an exact manifest case, preserving the selection through process restarts.
- Diagnostic summaries have separate names, `diagnostic: true` and `complete: false`.
  Exit 0 certifies only the selected scope. Kotlin failure-probe verification is
  not claimed for TS-only runs. Failure reports may include an allowlisted storage
  error code; raw native/SQL errors and credential values remain excluded.
- On device 1b274288, `--installed --case legacy-formats-1-2-3` reproduced the
  existing failure without any installation, now identified as `storage-database`.
  The underlying migration failure is not fixed by this workflow change.
- `--installed --case crash-after-marker` passed with exactly one case and one
  automatic real process restart, exit 0, no build or installation. Evidence:
  `mobile/tests/artifacts/native/android-diagnostic-summary.json`.
- A full reuse-project run assembled successfully and logged
  `Keeping unchanged installed APK: com.familyhub.app.nativetest`, confirming the
  host install was skipped by hash. The previously removed instrumentation APK
  still needed its initial installation, which the phone rejected with
  `INSTALL_FAILED_USER_RESTRICTED`. No installation loop was attempted afterward.
  Direct ADB Kotlin execution and its parser therefore have host-test coverage,
  but have not yet been validated end-to-end on this device. One phone approval
  for the missing test APK remains necessary for the next full Kotlin run.
- Typecheck, runner syntax, host tests and whitespace checks passed. README and
  native execution contract describe the new commands and diagnostic boundaries.
  T023/T060 remain unchecked; no dependent product tasks were marked complete.

## Read-only legacy snapshot fix (2026-11-04)

### Reproduction and cause

- Restored official Node 22.22.0 under `/tmp/familyhub-tools/` and verified the
  archive against the official release SHA-256. Android device `1b274288`
  (M2101K6G, Android 13) is connected and authorized.
- Requirements checklist remains 16/16. No extension hook configuration exists.
  Existing ignore rules cover generated builds, credentials and local evidence.
- First ran the requested `npm run test:native -- --platform android --device
  1b274288 --installed --case legacy-formats-1-2-3`. It reproduced the failure
  without installing an APK. Added allowlisted test-only stage diagnostics;
  the device report isolated `storage-database` to `legacy-snapshot`, before
  target database initialization/import.
- The source was opened with `SQLiteDatabase.OPEN_READONLY`, then passed
  `execSQL("BEGIN")`. Android translates this statement into an exclusive
  transaction; see the [AOSP SQLiteSession implementation](https://android.googlesource.com/platform/frameworks/base/+/c14df8e/core/java/android/database/sqlite/SQLiteSession.java).
  This is incompatible with the deliberately read-only connection. Native errors
  are sanitized by bootstrap, which explains the misleading generic database code.

### Change

- Extracted `readLegacySnapshot(File)` into `LegacySnapshotReader.kt` and use it
  from the Expo module. It reads the complete account projection with one SELECT
  through Android's SQLite API, including committed WAL data, without the invalid
  explicit BEGIN/COMMIT/ROLLBACK sequence. It retains source files, schema/ID
  validation, decoder formats 1–3 and sanitized errors. No source is opened for
  writing, and no fallback/reset or key generation was introduced.
- Added two native regression tests: reading committed WAL rows while a writer
  remains open with exact credential values/source retained, and reading an empty
  source without requiring or generating a legacy key. Manifest now expects 7
  instrumentation tests (previously 5).
- Test-only stage metadata is allowlisted and contains no SQL, credentials, keys
  or raw exception messages. Product error messages are unchanged.

### Executed verification and remaining limits

- `npm run typecheck`: passed. `npm test -- --runInBand`: 22/22 tests passed.
  `npm run test:host`: 7/7 tests passed. `git diff --check`: passed.
- Started the complete Android command without reuse, regenerating native-test
  configuration and building both APKs. Gradle succeeded in 5m 40s (576 tasks,
  544 executed, 32 up-to-date), including the corrected reader and both regression
  tests. Host APK installation succeeded. The phone rejected the separate test APK:
  `INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`. No Kotlin tests ran
  in this attempt. The user was asked about availability to approve that install;
  no automatic installation retry loop was started.
- With the corrected host already installed, the same focused
  `--installed --case legacy-formats-1-2-3` command passed: 1/1 case, TS failure
  probe verified, no APK installation. Local evidence:
  `mobile/tests/artifacts/native/2026-11-04/legacy-formats-fixed.json`.
- Repeated all Android TS scenarios using `npm run test:native -- --platform
  android --device 1b274288 --installed`: **34 passed, 0 failed, 0 skipped,
  10 actual automatic process restarts**, TS failure probe verified, exit 0.
  Local evidence: `mobile/tests/artifacts/native/2026-11-04/android-typescript-suite.json`.
  The report correctly remains diagnostic (`complete: false`): it contains no
  fresh Kotlin group and does not claim full platform acceptance.
- The requested migration defect is fixed and its Android TS checks pass.
  The expanded 7-test Kotlin suite and its failure probe still require device
  execution after one test-APK installation approval. Historical 5-test results
  are not substituted. iOS remains unverified on this Linux host.
- T023/T060 stay unchecked. No dependent UI/story tasks were started and no
  release approval is claimed. No after-implement hooks are configured.

## T023/T073 retry: instrumentation APK still rejected (2026-11-04)

- Rechecked prerequisites and the requirements checklist (16/16), existing ignore
  rules and T023/T073 dependencies. No extension hooks are configured.
- Device 1b274288 is online and authorized. Node 22.22.0 and the already compiled
  instrumentation APK are available; no APK rebuild or host reinstall was needed.
- Retried only installation of `app-debug-androidTest.apk` via `adb -s 1b274288
  install -r ...`. Android again returned `INSTALL_FAILED_USER_RESTRICTED:
  Install canceled by user`. Therefore no new Kotlin/device tests ran in this retry.
- Inspected the compiled test APK manifest with aapt2: package is
  `com.familyhub.app.nativetest.test`, debuggable is true, and no testOnly flag is
  present. A missing `-t` flag was considered but not established as the cause;
  no speculative runner change or device-policy bypass was made.
- Host orchestration command exited 0 again. Previously recorded successful
  34-case TS diagnostics and the legacy snapshot fix remain valid; they were not
  represented as a new full Android/Kotlin acceptance run.
- T023/T060/T073 remain unchecked. Completion requires the instrumentation APK to
  be allowed on the phone and the complete Kotlin/TS Android run, plus the still
  outstanding iOS verification. No dependent story implementation was started.

## T023/T073 retry: MIUI confirmation identified (2026-11-04)

- Requirements checklist again passes 16/16; device 1b274288 is authorized, but
  package com.familyhub.app.nativetest.test is still absent.
- Retried only the already built instrumentation APK installation. It again
  failed with INSTALL_FAILED_USER_RESTRICTED; no Kotlin tests ran and no host
  APK was rebuilt or reinstalled.
- Read-only inspection of the relevant installation messages confirms MIUI's
  com.miui.permcenter.install.AdbInstallActivity was displayed at 12:01:33 and
  closed around 12:01:45, followed by PackageInstallerSession reporting the
  cancellation. A foreground check afterward showed the USB settings activity.
  The logs establish a displayed device confirmation, but do not prove whether
  it was dismissed by user action or automatically. No security policy was changed.
- Further retries require the user to be ready to approve this MIUI install
  confirmation on the unlocked phone. Repeating the build or the Speckit command
  alone cannot supply that device confirmation. T023/T060/T073 remain open;
  previously recorded TS successes remain unchanged. No extension hooks exist.

## T023/T073: complete Android acceptance passed (2026-11-04)

- The authorized device `1b274288` reconnected over USB. Installation of the
  existing `app-debug-androidTest.apk` succeeded after the phone confirmation;
  the prior installation blocker is resolved.
- Executed from `mobile/` with Node 22.22.0, JBR 21.0.11 and the Android SDK:
  `npm run test:native -- --platform android --device 1b274288 --reuse-native-project`.
  This reused the native-test project generated during the earlier fresh build;
  no native configuration changed afterward. Gradle succeeded in 1m 33s
  (576 tasks: 23 executed, 553 up-to-date). SHA-256 comparison retained both
  unchanged installed APKs, with no new installation prompts.
- AndroidJUnitRunner executed **7 Kotlin tests: 7 passed, 0 failed, 0 skipped**,
  including the read-only WAL and empty-source regressions. The separate
  intentional Kotlin failure probe was detected as expected.
- The same complete runner invocation then executed **34 TypeScript scenarios:
  34 passed, 0 failed, 0 skipped**, including `legacy-formats-1-2-3`, with
  **10 real process restarts**. Its intentional TypeScript failure probe was
  detected as expected. The command exited 0 and stopped its Metro process.
- Sanitized local evidence: `mobile/tests/artifacts/native/android-summary.json`,
  archived as `mobile/tests/artifacts/native/2026-11-04/android-full-summary.json`.
  This report has `complete: true`, `diagnostic: false`, both result groups and
  `failureProbesVerified: true`; it is full Android acceptance, not a diagnostic.
- Host orchestration verification also passed **7/7** using
  `node tests/tools/nativeTestOrchestration.test.mjs` with the same Node executable.
- Retried `node tests/tools/run-native-tests.mjs --platform ios` on this Linux
  host: exit 1, `iOS native tests require macOS, Xcode and an iOS Simulator`.
  No iOS tests ran. On a macOS/Xcode machine with a booted Simulator, the remaining
  command from `mobile/` is `npm run test:native -- --platform ios --device UDID`.
- T023/T060/T073 remain unchecked solely because the required iOS platform
  acceptance is outstanding. Downstream story tasks remain gated; no Android
  installation or legacy-snapshot defect is still claimed open. README and the
  current execution summary in tasks.md now reflect the successful Android run.
- No extension hooks are configured. Documentation whitespace validation passed.

## Prüfsequenz ab 2026-11-04: Android zuerst, iOS im Folgeschritt

Der Nutzer hat am 2026-11-04 die zeitliche Verschiebung der iOS-Grundlagenprüfung
freigegeben. Begründung: Entwicklung in einer Linux-VM auf Windows, kein Mac mit
Xcode verfügbar. Als dokumentierte zeitliche Ausnahme gemäß Constitution-Governance
schließt der vollständige Android-Nachweis T023/T060/T073 nur im Android-Umfang ab
und gibt T024 ff. zur Implementierung frei. Der gesamte bisherige iOS-Prüfumfang
bleibt als T087 offen: nach T031, vor T032/T034 (bei verfügbarer Mac-Umgebung früher).
Ein iOS-Simulator auf macOS genügt; ein physisches iPhone ist nicht erforderlich.
Keine iOS- oder vollständige Feature-/Releasefreigabe ohne diesen Nachweis;
Entfernung der alten Kotlin-App bleibt an sämtliche bisherigen Gates gebunden.
Dies ändert die Reihenfolge, nicht die plattformübergreifenden Produktanforderungen.

Android-Nachweis unverändert: 7 Kotlin-, 34 TS-Tests, beide Fehlerproben und
10 Prozessneustarts bestanden. T023/T060/T073 im Android-Umfang abgeschlossen;
T087 offen. Frühere Einträge mit vollständiger Sperre beschreiben den historischen
Stand vor dieser Nutzerentscheidung.

## US1 implementation: T024–T031/T063/T074 (2026-11-04)

- Implemented account validation, input identity fixtures, account repository,
  local form hook, accessible scrollable creation screen, minimal summary list,
  and Expo Router start/create routes. Required fields and school allowlist are
  enforced; child identity uses the existing Kotlin-compatible trim/NFC/lower/NFC
  function. Credential whitespace is preserved.
- Creation checks identity inside the exclusive transaction before INSERT; the
  database UNIQUE constraint remains in place. Duplicate identity and unrelated
  save failures are distinguished. Success follows commit; after an uncertain
  transaction result, the exact attempted row is read back without a retry INSERT.
  Repository/unit and real native tests cover rollback and commit uncertainty.
- The list projects only ID/child/school. Focus/foreground reloads discard stale
  responses; load errors are distinct from an empty database. The form prevents
  repeated submissions and clears/discards local credentials on success/leaving.
- `npm run typecheck`: passed with Node 22.22.0.
- `npm test -- --runInBand`: **48 tests passed across 6 suites**. Includes input
  normalization/validation, unrelated SQL errors, conflicting commit readback,
  form validation/school choice/password concealment, duplicate/save failures,
  busy state, post-commit return, secret clearing and summary/error/retry behavior.
- `npm run test:host`: **7 tests passed**. Host scope selection and expected TS
  counts now include the new creation manifest group on both platforms.
- On Android device `1b274288`, executed
  `npm run test:native -- --platform android --device 1b274288 --installed`:
  **44 passed, 0 failed, 0 skipped, 12 real process restarts**, TS intentional
  failure probe verified, exit 0. No Gradle, prebuild, installation or Kotlin
  rerun was performed. Evidence is diagnostic (`complete: false`), archived at
  `mobile/tests/artifacts/native/2026-11-04/android-us1-creation-suite.json`.
- The 10 new native cases cover ten accounts over freshly keyed connections,
  concurrent normalized duplicates, rollback, uncertain commit readback, process
  termination before/after commit, credential values over 65,535 UTF bytes, and
  missing/wrong keys/unavailable cipher with no partial account retained.
  Unavailable cipher is injected at the database boundary; successful cases use
  the real installed SQLCipher and SecureStore implementations.
- The Preview-profile Android JS/Hermes export also succeeded:
  `FAMILYHUB_BUILD_PROFILE=preview node node_modules/expo/bin/cli export --platform
  android --output-dir /tmp/familyhub-us1-preview-export` (1206 modules).
  This validates product-route bundling, not an APK build or standalone offline
  UI/device acceptance. Those remain part of T032 and later tasks.
- T024–T031 and overlapping implementation tasks T063/T074 are marked complete.
  T066/T079 remain open for the remaining story/native/Preview/platform evidence.
  Per the user's deferred test sequence, T087 is now due before T032/T034. No
  macOS/Xcode environment is available here; iOS and full US1 acceptance remain
  unverified. No downstream story, deletion or removal gates were bypassed.
- No before/after extension hooks are configured. `git diff --check` passed.

## iOS foundation verification: T087 (2026-11-04)

- Environment: macOS 26.6.2 (25G83), Xcode 27.2 (27B52), Node 22.23.4,
  CocoaPods 1.17.0. Simulator: iPhone 18 Pro, iOS 27.2 (24B8117), arm64,
  UDID `14C32067-CA45-4C2C-ADD8-BEF47ED9FE02`. Native-test app:
  `com.familyhub.app.nativetest`, version 0.2.0, build 2, SQLCipher enabled.
- Installed Xcode and its iOS runtime, completed first-launch setup and installed
  the locked npm dependencies. Xcode is selected for these commands through
  `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`; the system default
  still points to Command Line Tools. Node 22 is selected through PATH.
- Fresh native-test prebuild and Simulator builds succeeded. Initial runs stopped
  before the suites: Expo's automatic Simulator activation required denied System
  Events access; `simctl openurl` then displayed an interactive iOS Open dialog.
  Scheme approval did not resolve that dialog on this runtime. The final host
  builds with Expo's generic Simulator destination, installs with `simctl`, and
  launches the app directly with Expo's `--initialUrl` process argument. No
  scheme-approval modification or Simulator reboot is required by the final code.
- After host-only corrections, the final command from `mobile/` was:

  ```bash
  PATH=/opt/homebrew/opt/node@22/bin:$PATH \
  DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  npm run test:native -- --platform ios \
    --device 14C32067-CA45-4C2C-ADD8-BEF47ED9FE02 --reuse-native-project
  ```

  This reused the freshly generated, unchanged native-test project, checked its
  test bundle identifier, harness references and SQLCipher property, rebuilt and
  installed its binary, then executed the full iOS scope. It did not use the
  Android-only `--installed` diagnostic path or a single-case filter.
- Result: **31 passed, 0 failed, 0 skipped, 7 real process restarts, exit 0**.
  The intentional TypeScript failure probe produced the expected failure before
  normal execution. The 21 storage/bootstrap and 10 creation cases exercised real
  SecureStore and SQLCipher. Existing injected fault cases remain injections;
  this is not a device-lock or comprehensive storage-lifecycle acceptance claim.
- Android's 13 legacy migration scenarios and Kotlin instrumentation are
  **not applicable on iOS**, rather than skipped required iOS tests. The host
  correctly emitted only the `typescript` result group.
- Local runner output: `mobile/tests/artifacts/native/ios-summary.json`, marked
  `complete: true`, `diagnostic: false`. Versioned sanitized evidence, expected
  scenario manifest, package/build versions and executable SHA-256:
  [2026-11-04-ios-foundation.json](evidence/2026-11-04-ios-foundation.json).
  Per-case result reporting remains open under T083; no raw errors or secrets
  are included in the evidence.
- Regression checks: typecheck passed; 48 unit/component tests in 6 suites passed
  (`--runInBand --watchman=false`); 7 host tests passed. Simulator builds reported
  0 errors and 2 Expo warnings (CoreModule visibility and script dependencies).
- T087 is complete and T032 is next. Standalone offline Preview, additional
  security/lifecycle coverage, accessibility, performance, user studies, full
  story/release acceptance and Kotlin-removal gates remain open. Earlier entries
  recording unavailable macOS/iOS infrastructure describe the historical state.

## Offline Preview preparation: T032 (2026-11-04)

- Sanitized result snapshot: [T032 preparation evidence](evidence/2026-11-04-t032-preparation.json).
- Added `mobile/.maestro/create-account.yaml`, parameterized fill/assert helpers,
  stable form/action test IDs, and [execution instructions](../../mobile/.maestro/README.md).
  The flow creates ten synthetic accounts across both schools, checks every child
  after a process stop/start, rejects a case/whitespace duplicate with a different
  school, and checks all ten children after another restart. Visible credentials
  are rejected. It requires an empty isolated preview installation and never clears
  application data or the iOS Keychain. Exact SQL counts and Unicode/commit faults
  remain separate native checks, rather than claims of the UI assertions.
- Environment: Linux, Node 22.23.4 (temporary official distribution verified against
  its published SHA-256), JDK 21.0.12.1, Maestro 2.12.1; locked Expo 58.0.19,
  React Native 0.88.0, React 19.3.0. Connected Android test device: Xiaomi
  M2101K6G, Android 13, serial `1b274288`.
- Checks passed: official `maestro check-syntax` including helper references;
  typecheck; 48 unit/component tests in 6 suites; 7 host tests; `git diff --check`.
  The first cold Jest run timed out in one component test (47/48 passed); repeating
  the unchanged suite passed all 48. No timeout increase or test suppression.
- Separate native-test command from `mobile/`:

  ```bash
  npm run test:native -- --platform android --device 1b274288 --installed
  ```

  Result: **44 passed, 0 failed/skipped, 12 real process restarts**, intentional TS
  failure probe verified, exit 0. Report:
  `mobile/tests/artifacts/native/android-diagnostic-summary.json` with
  `diagnostic: true`, `complete: false`. No Kotlin group or full platform acceptance
  is claimed. The runner stopped its Metro server after execution.
- Fresh preview generation and release build from `mobile/` succeeded:

  ```bash
  FAMILYHUB_BUILD_PROFILE=preview npx expo prebuild --platform android --no-install
  cd android
  FAMILYHUB_BUILD_PROFILE=preview ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
  ```

  Local Android SDK was supplied through `ANDROID_HOME`; Node 22 through PATH.
  Gradle 9.4.1, Kotlin plugin 2.2.10, compile SDK 37, target SDK 36,
  NDK 27.1.12297006. Build succeeded in 12m28s (896 tasks). Generated app ID:
  `com.familyhub.app`, version 0.2.0/build 2; preview config and generated Android
  sources have no FamilyHub native-test harness/source-set registration.
  APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`;
  SHA-256 `0f5968d417b2f155601dc5da8ad134aef61466eb0ea2e8672793ea815baf24dd`.
  ZIP inspection confirms embedded `assets/index.android.bundle` (2,156,064 bytes).
  This proves packaging/build success, not successful device startup.
- Installation using `adb -s 1b274288 install .../app-release.apk` failed with
  `INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`. Previously only the
  separate native-test packages were installed. No uninstall/reset was attempted.
  The Preview UI flow did **not** run. Device Wi-Fi and mobile-data settings were
  read (both enabled), but not changed. Metro ports 8081/8089 were confirmed idle
  after the native diagnostic.
- **T032 remains open.** Resume by allowing USB installation on the test device,
  installing the existing APK, disabling device networking, and running the main
  Maestro flow as documented. Restore the original networking state afterwards.
  Then execute the separate iOS Preview flow on macOS/Xcode; that environment is
  unavailable in this session. Earlier T087 iOS results remain valid but do not
  substitute for this standalone Preview run. T033/T034 and later sequential
  acceptance work were not advanced. No full US1 or release acceptance is claimed.
- No extension hooks are configured. The existing `feature/account-creation`
  branch is continued from current `main`; no push, remote merge or publication.

### Android installation retry and offline startup (2026-11-04)

- Following explicit user confirmation that the installation prompt had been
  dismissed accidentally, retrying the same APK installation succeeded. No new
  build or application reset was needed; the APK hash above still applies.
- Wi-Fi and mobile data were both initially enabled (`1`); temporarily disabled
  using `adb shell svc wifi disable` and `svc data disable`, and both settings
  confirmed `0`. Metro ports 8081/8089 had no listener. Ran from `mobile/`:

  ```bash
  maestro --device 1b274288 test --format junit \
    --output tests/artifacts/preview/android/create-account.xml \
    --debug-output tests/artifacts/preview/android/debug .maestro/create-account.yaml
  ```

- Preview offline launch and the expected empty-state assertion **passed**.
  The first tap on `account-add` failed because Android denied `INJECT_EVENTS`.
  Maestro's terminal/JUnit message was only "Unknown error"; the local command
  metadata identifies the input-permission denial. The 1/1 flow failed (exit 1);
  no account was created and no restart/duplicate acceptance was reached.
  This is a test-device input restriction, not evidence of account-creation failure.
- Asked the user to enable the Xiaomi developer option for USB debugging security
  settings before retrying; no attempt was made to grant privileged input permission
  by bypassing the device's security controls. Wi-Fi and mobile data were restored
  with `svc ... enable` and both confirmed `1` after the failed flow.
- Local Maestro artifacts include a device-wide logcat; they remain in ignored
  `mobile/tests/artifacts/` and are not versioned or used as sanitized evidence.
  The evidence JSON above records only the relevant result and permission code.
  T032 remains open for a successful complete Android flow and iOS Preview run.

### Xiaomi launch-control diagnosis after continuation (2026-11-04)

- User authorized continuing after enabling USB-debugging security settings.
  The next attempt initially stopped while reinstalling the Maestro driver with
  `INSTALL_FAILED_USER_RESTRICTED`. Restored networking, prepared the driver online,
  then used the documented Maestro 2.12.1 option `test --no-reinstall-driver` for
  the offline flow. No application data was reset or account created.
- The driver reached flow execution, but the launch/empty-state assertion failed.
  Screenshots/hierarchy showed Android developer settings in the foreground.
  Initial suspicion that manual device interaction caused this was not supported
  by the subsequent diagnostic: filtered ActivityTaskManager logs explicitly show
  a `com.familyhub.app/.MainActivity` launch request from `dev.mobile.maestro`
  followed by `Abort background activity starts`. This is a distinct Xiaomi
  restriction on the driver's ability to open another app, beyond input injection.
- Direct `adb shell am start -W -n com.familyhub.app/.MainActivity` succeeded
  while offline; a local screenshot confirmed the correct empty Preview UI and
  `pidof` confirmed the process remained alive. The crash buffer contained no
  crash record. This supports a test-launch-control restriction; it does not
  establish a successful complete Maestro flow or prove the input permission fixed.
- Asked for the Maestro application's permission to open windows from the
  background. Instructions and reuse-driver guidance added to the Maestro README.
  Wi-Fi/mobile data were both `1` before the attempts, both confirmed `0` during
  the offline main flow, and enabled again for the diagnostic pause.
  T032, downstream sequential gates and iOS Preview remain open. No additional
  product changes or claims of completed account-creation acceptance.

### Final authorized personal-device attempt and cleanup (2026-11-04)

- User explicitly limited further testing to **one last attempt** on the personal
  Xiaomi device because of security concerns. That authorization is now consumed.
  No further attempts or additional automation permissions on that device;
  use an emulator or a separate test device for subsequent work. Updated the
  Maestro guide and tasks to preserve this instruction across future invocations.
- Ran the unchanged `create-account.yaml` once using `--no-reinstall-driver`,
  local JUnit output target `tests/artifacts/preview/android/create-account-final.xml`
  and debug target `tests/artifacts/preview/android/final-debug`. Wi-Fi and mobile
  data were initially `1`, disabled and confirmed `0`; Metro ports 8081/8089 were idle.
  No cloud execution, state clearing, application reinstall or test retry.
- Start/input control worked. Passive local progress screenshots showed the third
  and sixth forms, eight saved accounts, and finally all **ten** synthetic children
  with their alternating schools in the overview. No real credentials were used.
  This is observed UI evidence; no exact SQL count was read by the preview flow.
- The host process ended with **exit 143** before a completed JUnit/command report
  was written. The cause of termination is not established. The complete flow
  did not produce a passing result; neither the two process-restart checkpoints
  nor duplicate rejection can be accepted from this attempt. No further run was
  started, as requested. T032 stays unchecked; iOS Preview is also outstanding.
- Cleanup completed: restored Wi-Fi/mobile data with `svc ... enable`, confirmed
  both `1`; uninstalled only `dev.mobile.maestro.test` and `dev.mobile.maestro`,
  both returned `Success`; verified `pm list packages maestro` returned no packages.
  Family Hub and its synthetic test accounts remain installed. Deleted three
  generated device-wide `device-logcat.txt` files from the local Maestro artifact
  directories; no such raw logs are versioned. Targeted reports/metadata remain local.
- No global developer/security toggles were changed automatically. User can now
  switch off USB debugging, USB-debugging security settings and USB installation,
  and disconnect the cable. The Maestro-specific background-window permission
  belonged to the removed helper application.
- Documentation-only follow-up validated with JSON parsing and `git diff --check`.
  Earlier type/unit/host/native/build results above are unchanged; none substitutes
  for the incomplete end-to-end run. No full story/platform/release acceptance.

### Emulator-only continuation and x86_64 Preview (2026-11-04)

- User clarified that the personal phone should retain the preview for **manual**
  operation/display testing, with no automated Maestro/native/device tests. Recorded
  this in AGENTS.md, mobile README, and tasks. The phone was not contacted in this
  continuation. The existing feature/account-creation branch and clean prior work
  were retained. Requirements checklist remains 16/16 complete; no extension hooks.
- Added `npm run test:preview:android -- --device emulator-5554`. Its new wrapper
  rejects physical/missing/malformed targets before any ADB invocation; then
  checks `ro.kernel.qemu=1`, completed boot, installed product package and disabled
  Wi-Fi/mobile data using only explicit `-s emulator-PORT` read commands.
  It does not discover devices, install/reset apps, change networking or retry.
  Product package presence alone does not certify the build profile: the documented
  precondition is installation of the dedicated preview APK, plus stopped Metro.
  Maestro runs locally with analytics disabled and its existing driver reused.
  Each run has a unique timestamp/PID artifact directory and a 45-minute command
  timeout. Nonzero exit, termination or missing full report remains incomplete.
- `npm run test:host` passed **13 checks** (7 existing orchestration checks and
  6 new emulator-guard checks). A separate CLI negative probe with a synthetic
  physical-device identifier exited 1 with the expected emulator-only message,
  without invoking ADB. These host checks do not represent native or Preview UI
  acceptance. No product logic changed; existing app tests were not rerun needlessly.
- Emulator feasibility: outside the sandbox, Android Emulator 37.2.12.0
  `-accel-check` returned exit 3, `KVM requires a CPU that supports vmx or svm`.
  The installed `Medium_Phone_API_37.0` x86_64 AVD was tried with
  `-read-only -no-window -no-audio -no-snapshot -accel off -gpu swiftshader -port 5560`.
  Only emulator-5560 was queried. It remained ADB-offline at both boot checks.
  Stopped this diagnostic instance using its emulator console; snapshots were
  disabled, no saved AVD data was replaced. The emulator exited 139 during teardown
  after the requested stop; no successful boot or runtime result is claimed.
  Google documents unaccelerated operation as very slow/unsupported in the
  [emulator command-line reference](https://developer.android.com/studio/run/emulator-commandline).
  A supported host emulator environment is still needed; macOS/Xcode is also
  unavailable in this session for the outstanding iOS Preview run.
- Built the unchanged product sources for an x86_64 host emulator using:

  ```bash
  FAMILYHUB_BUILD_PROFILE=preview ./gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64 --console=plain
  ```

  From mobile/android with Node 22 and ANDROID_HOME supplied. **Build passed in
  4m58s**, 896 tasks (63 executed, 833 up-to-date). APK ZIP inspection confirms only
  `lib/x86_64/` libraries and embedded `assets/index.android.bundle`.
  Preserved the existing ARM64 preview separately before building; no installation
  was attempted on the personal phone or a non-ready emulator.

  | Purpose | Local ignored artifact | SHA-256 |
  | --- | --- | --- |
  | Android x86_64 emulator | `mobile/tests/artifacts/preview/android/x86_64/app-release.apk` | `2c4766964ef143264550200ce68ff571060a110ff255b1e25880ab2090162f7f` |
  | Manual ARM64 phone testing | `mobile/tests/artifacts/preview/android/arm64-v8a/app-release.apk` | `0f5968d417b2f155601dc5da8ad134aef61466eb0ea2e8672793ea815baf24dd` |

- **T032 remains unchecked** for actual complete Android/iOS Preview execution.
  No downstream sequential gates advanced. Pending host-environment information
  does not authorize phone automation or imply successful runtime acceptance.

### Renewed phone authorization and preserved test inventory (2026-11-04)

- User explicitly authorized using the connected smartphone again for the current
  T032 continuation. Recorded the narrow exception in AGENTS.md; the default
  emulator-only wrapper remains unchanged. This is not a blanket authorization
  for future features or deletion of existing data.
- Direct preview launch and a local overview screenshot confirmed the existing
  ten synthetic `Offline Kind` accounts with their schools. Maestro helpers were
  absent, consistent with the prior cleanup. No account data was reset or removed.
- Parameterized the main flow and assertion helper: default empty-state validation
  remains active; explicitly passing `REQUIRE_EMPTY=false` plus a new ASCII
  `CHILD_PREFIX` creates a separate ten-account fixture set, checks that set after
  restarts and rejects its normalized duplicate. Existing accounts remain intact.
  Official Maestro syntax validation passed; `git diff --check` passed.
- Extracted only `maestro-app.apk` and `maestro-server.apk` from the existing
  official Maestro 2.12.1 distribution to temporary local files. Both explicit
  installations on the selected serial returned `INSTALL_FAILED_USER_RESTRICTED`
  (`Install canceled by user`). Asked the user to ready USB installation/confirm
  the prompts before any retry. No further flow or native test has run, no
  networking setting changed, and no new platform/US1 acceptance is claimed.
