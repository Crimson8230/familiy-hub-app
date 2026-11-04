import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Validate before any device operation. Never discover or select a physical phone.
export function verifyPreviewEmulator(device, adb) {
  if (!/^emulator-\d+$/.test(device ?? '')) throw new Error('An explicit --device emulator-PORT is required; physical devices are excluded.');
  const read = (...args) => adb(['-s', device, 'shell', ...args]).trim();
  if (read('getprop', 'ro.kernel.qemu') !== '1') throw new Error('Selected device is not an Android emulator.');
  if (read('getprop', 'sys.boot_completed') !== '1') throw new Error('Emulator is not fully booted.');
  if (!read('pm', 'path', 'com.familyhub.app').startsWith('package:')) throw new Error('Install the preview APK in the emulator first.');
  if (read('settings', 'get', 'global', 'wifi_on') !== '0' || read('settings', 'get', 'global', 'mobile_data') !== '0') {
    throw new Error('Disable emulator Wi-Fi and mobile data before the offline test.');
  }
}

export function main(args = process.argv.slice(2)) {
  if (args.length !== 2 || args[0] !== '--device') throw new Error('Usage: npm run test:preview:android -- --device emulator-5554');
  const device = args[1];
  const adbBinary = process.env.ANDROID_HOME
    ? path.join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : 'adb';
  const command = (binary, params, options = {}) => {
    const result = spawnSync(binary, params, { cwd: root, encoding: 'utf8', timeout: 15000, ...options });
    if (result.error || result.status !== 0) {
      const reason = result.error?.code ?? result.signal ?? `exit ${result.status}`;
      throw new Error(`Command failed: ${path.basename(binary)} (${reason})`);
    }
    return result.stdout ?? '';
  };
  verifyPreviewEmulator(device, params => command(adbBinary, params));
  const runId = `${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`;
  const artifacts = path.join(root, 'tests/artifacts/preview/android', runId);
  mkdirSync(artifacts, { recursive: true });
  console.log(`Preview reports: ${artifacts}`);
  // A long flow must not be mistaken for a quick unit test. No state clearing,
  // installations, networking changes, or retries are performed by this wrapper.
  command(process.env.FAMILYHUB_MAESTRO ?? 'maestro', [
    '--device', device, 'test', '--no-reinstall-driver', '--format', 'junit',
    '--output', path.join(artifacts, 'create-account.xml'),
    '--debug-output', path.join(artifacts, 'debug'), '.maestro/create-account.yaml',
  ], {
    stdio: 'inherit', timeout: 45 * 60 * 1000,
    env: { ...process.env, MAESTRO_CLI_NO_ANALYTICS: '1', MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: 'true' },
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
