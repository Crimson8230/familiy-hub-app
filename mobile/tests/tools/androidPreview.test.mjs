import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPreviewEmulator } from './run-android-preview.mjs';

test('physical, missing and malformed targets cannot invoke ADB', () => {
  for (const device of [undefined, '', '1b274288', '-d', 'emulator-', 'emulator-5554;other']) {
    let called = false;
    assert.throws(() => verifyPreviewEmulator(device, () => { called = true; }), /physical devices are excluded/);
    assert.equal(called, false);
  }
});

function fixture(overrides = {}) {
  const results = {
    'getprop ro.kernel.qemu': '1', 'getprop sys.boot_completed': '1',
    'pm path com.familyhub.app': 'package:/data/app/base.apk',
    'settings get global wifi_on': '0', 'settings get global mobile_data': '0', ...overrides,
  };
  const calls = [];
  return { calls, adb: args => {
    calls.push(args);
    assert.deepEqual(args.slice(0, 3), ['-s', 'emulator-5554', 'shell']);
    return results[args.slice(3).join(' ')] ?? '';
  } };
}

test('emulator-like serial still requires native emulator identity', () => {
  const f = fixture({ 'getprop ro.kernel.qemu': '0' });
  assert.throws(() => verifyPreviewEmulator('emulator-5554', f.adb), /not an Android emulator/);
  assert.equal(f.calls.length, 1);
});
test('boot-incomplete emulator is rejected', () => {
  const f = fixture({ 'getprop sys.boot_completed': '' });
  assert.throws(() => verifyPreviewEmulator('emulator-5554', f.adb), /not fully booted/);
});
test('missing preview package is rejected', () => {
  const f = fixture({ 'pm path com.familyhub.app': '' });
  assert.throws(() => verifyPreviewEmulator('emulator-5554', f.adb), /Install the preview APK/);
});
test('either active network setting blocks an offline claim', () => {
  for (const setting of ['wifi_on', 'mobile_data']) {
    const f = fixture({ [`settings get global ${setting}`]: '1' });
    assert.throws(() => verifyPreviewEmulator('emulator-5554', f.adb), /Disable emulator/);
  }
});
test('ready offline emulator is checked only with targeted read operations', () => {
  const f = fixture();
  assert.doesNotThrow(() => verifyPreviewEmulator('emulator-5554', f.adb));
  assert.equal(f.calls.length, 5);
  assert.ok(f.calls.every(args => ['getprop', 'pm', 'settings'].includes(args[3])));
});
