import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseInstrumentation, validateGroup, validateGroups } from './native-results.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const platform = value('--platform');
const requestedDevice = value('--device');
const installed = args.includes('--installed');
const selectedCase = value('--case');
const diagnostic = installed || Boolean(selectedCase);
const manifest = JSON.parse(readFileSync(path.join(root, 'tests/native/scenarios.json'), 'utf8'));
if (selectedCase && ![...manifest.storage, ...manifest.legacy, ...manifest.creation].includes(selectedCase)) throw new Error('Unknown native scenario');
if (selectedCase && !installed) throw new Error('--case requires --installed (diagnostic run)');
const app = 'com.familyhub.app.nativetest';
const port = Number(process.env.FAMILYHUB_METRO_PORT ?? 8089);
const env = { ...process.env, FAMILYHUB_BUILD_PROFILE: 'native-test', EXPO_NO_TELEMETRY: '1' };
const adb = process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools/adb') : 'adb';
let metro;
function stopMetro() {
  if (metro?.pid) { try { process.kill(-metro.pid, 'SIGTERM'); } catch {} }
}
process.once('SIGINT', () => { stopMetro(); process.exit(130); });
process.once('SIGTERM', () => { stopMetro(); process.exit(143); });
function command(bin, params, options = {}) {
  const { failureMessage, ...spawnOptions } = options;
  const result = spawnSync(bin, params, { cwd: root, env, encoding: 'utf8', timeout: 900000, ...spawnOptions });
  if (result.error || result.status !== 0) throw new Error(failureMessage ?? `Native test command failed: ${path.basename(bin)}`);
  return result.stdout ?? '';
}
function json(value) { try { return JSON.parse(value); } catch { return null; } }
async function waitFor(read, accept, timeout = 120000, stage = 'report') {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await read();
    if (accept(value)) return value;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Native test timeout: ${stage}`);
}

try {
  if (!['android', 'ios'].includes(platform) || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use --platform android|ios and a valid port');
  let device, container;
  if (platform === 'android') {
    const listed = command(adb, ['devices']).split('\n').slice(1).map(line => line.trim().split(/\s+/)).filter(parts => parts[1] === 'device').map(parts => parts[0]);
    if (requestedDevice && !listed.includes(requestedDevice)) throw new Error('Selected Android device is unavailable');
    if (!requestedDevice && listed.length !== 1) throw new Error('Connect exactly one isolated Android test device or pass --device SERIAL');
    device = requestedDevice ?? listed[0]; env.ANDROID_SERIAL = device;
  } else {
    if (process.platform !== 'darwin') throw new Error('iOS native tests require macOS, Xcode and an iOS Simulator');
    const listed = Object.values(json(command('xcrun', ['simctl', 'list', 'devices', 'booted', '--json']))?.devices ?? {}).flat().filter(d => d.isAvailable);
    if (requestedDevice && !listed.some(d => d.udid === requestedDevice)) throw new Error('Selected iOS Simulator is unavailable');
    if (!requestedDevice && listed.length !== 1) throw new Error('Boot exactly one iOS Simulator or pass --device UDID');
    device = requestedDevice ?? listed[0].udid;
  }
  if (installed) {
    if (platform !== 'android') throw new Error('--installed currently supports Android only');
    command(adb, ['-s', device, 'shell', 'run-as', app, 'pwd']);
    console.log('Using installed test host: no prebuild, Gradle or APK installation.');
  } else if (args.includes('--reuse-native-project')) {
    if (platform === 'ios') {
      const generated = readFileSync(path.join(root, 'ios/FamilyHub.xcodeproj/project.pbxproj'), 'utf8');
      const properties = json(readFileSync(path.join(root, 'ios/Podfile.properties.json'), 'utf8'));
      if (!generated.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${app};`) ||
          !generated.includes('FamilyHubTestSupport.swift') || !generated.includes('FamilyHubTestSupport.m') ||
          properties?.['expo.sqlite.useSQLCipher'] !== 'true') throw new Error('Reuse requires an existing SQLCipher native-test iOS project');
    } else {
      const generated = readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');
      if (!generated.includes(`applicationId '${app}'`) && !generated.includes(`applicationId "${app}"`)) throw new Error('Reuse requires an existing native-test Android project');
      if (!generated.includes('com.familyhub.legacy') && !generated.includes('../../modules/legacy-accounts/android/src/androidTest/java')) throw new Error('Reuse requires the native instrumentation harness');
    }
  } else {
    command('npx', ['expo', 'prebuild', '--platform', platform, '--no-install'], { stdio: 'inherit' });
  }
  const groups = [];
  if (platform === 'android') {
    const android = path.join(root, 'android');
    const abi = command(adb, ['-s', device, 'shell', 'getprop', 'ro.product.cpu.abi']).trim();
    if (!['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'].includes(abi)) throw new Error('Unsupported Android test device architecture');
    const architecture = `-PreactNativeArchitectures=${abi}`;
    if (!installed) {
      command('./gradlew', [':app:assembleDebug', ':app:assembleDebugAndroidTest', architecture, '--no-daemon'], { cwd: android, stdio: 'inherit' });
      const ensureInstalled = (id, apk) => {
        const hash = createHash('sha256').update(readFileSync(apk)).digest('hex');
        const lookup = spawnSync(adb, ['-s', device, 'shell', 'pm', 'path', id], { cwd: root, env, encoding: 'utf8', timeout: 10000 });
        if (lookup.error || ![0, 1].includes(lookup.status)) throw new Error('Could not inspect installed test APK');
        const location = lookup.stdout.trim();
        let identical = false;
        if (/^package:\/[^\r\n]+$/.test(location)) {
          const remote = command(adb, ['-s', device, 'shell', 'sha256sum', location.slice(8)]).trim().split(/\s+/)[0];
          identical = remote === hash;
        }
        if (identical) console.log(`Keeping unchanged installed APK: ${id}`);
        else command(adb, ['-s', device, 'install', '-r', apk], { stdio: 'inherit', failureMessage: `Installation failed for ${id}. Approve the installation on the phone, then retry; --installed runs do not install APKs.` });
      };
      ensureInstalled(app, path.join(android, 'app/build/outputs/apk/debug/app-debug.apk'));
      ensureInstalled(`${app}.test`, path.join(android, 'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'));
      const component = `${app}.test/androidx.test.runner.AndroidJUnitRunner`;
      const positive = command(adb, ['-s', device, 'shell', 'am', 'instrument', '-w', '-r', '-e', 'package', 'com.familyhub.legacy', component]);
      groups.push({ name: 'android-instrumentation', ...parseInstrumentation(positive) });
      validateGroup(groups[0], manifest.androidInstrumentationTests);
      const evidenceDirectory = path.join(root, 'tests/artifacts/native');
      mkdirSync(evidenceDirectory, { recursive: true });
      writeFileSync(path.join(evidenceDirectory, 'android-partial-summary.json'), JSON.stringify({ platform, device, profile: 'native-test', complete: false, groups, failureProbesVerified: false }, null, 2));
      const negative = command(adb, ['-s', device, 'shell', 'am', 'instrument', '-w', '-r', '-e', 'class', 'com.familyhub.legacy.LegacyInfrastructureProbe', '-e', 'familyhubIntentionalFailure', 'true', component]);
      const probe = parseInstrumentation(negative);
      if (probe.failed !== 1 || probe.passed !== 0 || probe.skipped !== 0 || !negative.includes('runnerReportsIntentionalFailure')) throw new Error('Kotlin failure probe did not fail in the expected test');
      console.log('Kotlin suites and failure probe verified; APKs remain installed.');
    }
    command(adb, ['-s', device, 'reverse', `tcp:${port}`, `tcp:${port}`]);
  } else {
    // Build without Expo's GUI activation (which requires System Events access).
    // Installation and process control belong to the selected Simulator below.
    const output = path.join(root, 'tests/artifacts/native/ios-build');
    command('npx', ['expo', 'run:ios', '--device', 'generic', '--no-bundler', '--output', output], { stdio: 'inherit' });
    command('xcrun', ['simctl', 'install', device, path.join(output, 'FamilyHub.app')]);
    container = command('xcrun', ['simctl', 'get_app_container', device, app, 'data']).trim();
  }
  try { await fetch(`http://127.0.0.1:${port}/status`); throw new Error('Metro test port is already occupied'); }
  catch (error) { if (error.message === 'Metro test port is already occupied') throw error; }
  // Bind localhost to IPv4 consistently with host polling and adb reverse.
  const metroEnv = { ...env, NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --dns-result-order=ipv4first`.trim() };
  metro = spawn('npx', ['expo', 'start', '--dev-client', '--localhost', '--port', String(port)], { cwd: root, env: metroEnv, stdio: 'inherit', detached: true });
  await waitFor(async () => { try { return (await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(3000) })).text(); } catch { return ''; } }, result => result.includes('packager-status:running'), 120000, 'Metro readiness');
  console.log('Metro ready; preparing TypeScript failure probe.');
  const reportPath = platform === 'ios' ? path.join(container, 'Library/Application Support/familyhub-test-report.json') : null;
  const readReport = () => {
    try { return json(platform === 'android' ? command(adb, ['-s', device, 'shell', 'run-as', app, 'cat', 'files/familyhub-test-report.json']) : readFileSync(reportPath, 'utf8')); }
    catch { return null; }
  };
  const request = object => {
    if (platform === 'android') {
      command(adb, ['-s', device, 'shell', 'run-as', app, 'mkdir', '-p', 'files'], { timeout: 10000 });
      command(adb, ['-s', device, 'shell', '-T', 'run-as', app, 'tee', 'files/familyhub-test-report.json'], { input: JSON.stringify(object), timeout: 10000 });
      const written = readReport();
      if (written?.state !== object.state || written?.mode !== object.mode) throw new Error('Native test request was not persisted');
    }
    else { mkdirSync(path.dirname(reportPath), { recursive: true }); writeFileSync(reportPath, JSON.stringify(object)); }
  };
  const launch = async pendingRequest => {
    const link = `familyhub-nativetest://expo-development-client/?url=${encodeURIComponent(`http://127.0.0.1:${port}`)}`;
    if (platform === 'android') {
      command(adb, ['-s', device, 'shell', 'am', 'force-stop', app]);
      await waitFor(() => {
        const stopped = spawnSync(adb, ['-s', device, 'shell', 'pidof', app], { cwd: root, env, encoding: 'utf8', timeout: 10000 });
        if (stopped.error || ![0, 1].includes(stopped.status)) throw new Error('Could not verify Android test process termination');
        return stopped.status === 1 && !stopped.stdout.trim();
      }, stopped => stopped, 30000, 'Android process termination');
      if (pendingRequest) request(pendingRequest);
      command(adb, ['-s', device, 'shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', link, app]);
    } else {
      spawnSync('xcrun', ['simctl', 'terminate', device, app]);
      if (pendingRequest) request(pendingRequest);
      command('xcrun', ['simctl', 'launch', device, app, '--initialUrl', `${link}&disableOnboarding=1&disableAutoLaunch=1`]);
    }
  };
  await launch({ state: 'request', mode: 'intentional-failure' });
  console.log('TypeScript failure probe launched.');
  const probe = await waitFor(readReport, result => result?.state === 'complete', 120000, 'TypeScript failure probe');
  if (probe.failed !== 1 || probe.passed !== 0) throw new Error('Expected TS failure probe was not observed');
  console.log('TypeScript failure probe verified; starting normal suites.');
  await launch({ state: 'request', mode: 'normal', ...(selectedCase ? { selectedCase } : {}) });
  const deadline = Date.now() + 600000;
  let restarts = 0, result;
  while (Date.now() < deadline) {
    result = await readReport();
    if (result?.state === 'restart') {
      if (++restarts > 20) throw new Error('Native restart loop detected');
      console.log(`Restarting native test process for scenario ${result.index + 1}.`);
      await launch();
      await waitFor(readReport, next => next != null && (next.state !== 'restart' || next.index !== result.index), 120000, `scenario ${result.index + 1} restart acknowledgement`);
    }
    if (result?.state === 'complete') break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (result?.state !== 'complete') throw new Error('Native suites did not finish');
  groups.push({ name: 'typescript', passed: result.passed, failed: result.failed, skipped: result.skipped });
  const directory = path.join(root, 'tests/artifacts/native'); mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, `${platform}${diagnostic ? '-diagnostic' : ''}-partial-summary.json`), JSON.stringify({ platform, device, profile: 'native-test', complete: false, diagnostic, selectedCase, groups, restarts, failureProbesVerified: !diagnostic, typescriptFailureProbeVerified: true, failedScenarioIndex: result.failed ? result.index : undefined, failureReason: result.failed && /^(storage-(inconsistent|key-unavailable|key-mismatch|cipher-unavailable|database|schema|legacy|duplicate)|test-operation)$/.test(result.reason ?? '') ? result.reason : undefined }, null, 2));
  if (result.failed) throw new Error(`Native TypeScript scenario ${result.index + 1} failed (${result.passed} passed)`);
  const expectedTypeScript = selectedCase ? 1 : manifest.storage.length + manifest.creation.length + (platform === 'android' ? manifest.legacy.length : 0);
  if (diagnostic) validateGroup(groups[0], expectedTypeScript);
  else validateGroups(platform, groups, { typescript: expectedTypeScript, 'android-instrumentation': manifest.androidInstrumentationTests });
  writeFileSync(path.join(directory, `${platform}${diagnostic ? '-diagnostic' : ''}-summary.json`), JSON.stringify({ platform, device, profile: 'native-test', complete: !diagnostic, diagnostic, selectedCase, groups, restarts, failureProbesVerified: !diagnostic, typescriptFailureProbeVerified: true }, null, 2));
  console.log(JSON.stringify({ platform, groups, restarts }));
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally {
  stopMetro();
}
