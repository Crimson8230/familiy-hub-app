import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInstrumentation, validateGroups } from './native-results.mjs';

test('instrumentation counts completed tests, not start notifications', () => {
  const output = 'INSTRUMENTATION_STATUS_CODE: 1\nINSTRUMENTATION_STATUS_CODE: 0\nINSTRUMENTATION_CODE: -1\n';
  assert.deepEqual(parseInstrumentation(output), { passed: 1, failed: 0, skipped: 0 });
});
test('instrumentation distinguishes assertion failures and skipped tests', () => {
  assert.deepEqual(parseInstrumentation('INSTRUMENTATION_STATUS_CODE: -2\nINSTRUMENTATION_STATUS_CODE: -3\nINSTRUMENTATION_CODE: -1'), { passed: 0, failed: 1, skipped: 1 });
});
test('missing, crashed or empty instrumentation cannot pass as an expected failure', () => {
  for (const output of ['', 'INSTRUMENTATION_FAILED: runner missing', 'INSTRUMENTATION_STATUS_CODE: -2', 'INSTRUMENTATION_CODE: -1']) {
    assert.throws(() => parseInstrumentation(output));
  }
});

test('Android requires both real result groups', () => {
  assert.throws(() => validateGroups('android', [{ name: 'typescript', passed: 1, failed: 0, skipped: 0 }]));
});
test('empty, failed and skipped groups cannot pass', () => {
  for (const group of [
    { name: 'typescript', passed: 0, failed: 0, skipped: 0 },
    { name: 'typescript', passed: 1, failed: 1, skipped: 0 },
    { name: 'typescript', passed: 1, failed: 0, skipped: 1 },
  ]) assert.throws(() => validateGroups('ios', [group]));
});
test('a completed Android run includes both groups', () => {
  assert.doesNotThrow(() => validateGroups('android', [
    { name: 'android-instrumentation', passed: 1, failed: 0, skipped: 0 },
    { name: 'typescript', passed: 1, failed: 0, skipped: 0 },
  ]));
});

test('a partial result cannot stand in for the full suite', () => {
  assert.throws(() => validateGroups('ios', [{ name: 'typescript', passed: 1, failed: 0, skipped: 0 }], { typescript: 21 }));
});
