export function parseInstrumentation(output) {
  if (!/^INSTRUMENTATION_CODE: -1\s*$/m.test(output) || /INSTRUMENTATION_FAILED:|INSTRUMENTATION_ABORTED:/.test(output)) {
    throw new Error('Instrumentation did not complete');
  }
  const result = { passed: 0, failed: 0, skipped: 0 };
  for (const match of output.matchAll(/^INSTRUMENTATION_STATUS_CODE: (-?\d+)\s*$/gm)) {
    const code = Number(match[1]);
    if (code === 0) result.passed++;
    else if (code === -1 || code === -2) result.failed++;
    else if (code === -3 || code === -4) result.skipped++;
    else if (code !== 1 && code !== 2) throw new Error('Unknown instrumentation status');
  }
  if (!result.passed && !result.failed && !result.skipped) throw new Error('Instrumentation ran no tests');
  return result;
}

export function validateGroup(group, expectedCount) {
  if (expectedCount !== undefined && group.passed !== expectedCount) throw new Error('Native test count does not match the required suite');
  if (!Number.isSafeInteger(group.passed) || group.passed < 1 || group.failed !== 0 || group.skipped !== 0) throw new Error('Native test group did not pass');
}

export function validateGroups(platform, groups, expectedCounts = {}) {
  if (!['android', 'ios'].includes(platform) || !Array.isArray(groups)) throw new Error('Invalid native results');
  const expected = platform === 'android' ? ['android-instrumentation', 'typescript'] : ['typescript'];
  if (groups.length !== expected.length) throw new Error('Missing or unexpected native result group');
  for (const name of expected) {
    const matches = groups.filter(group => group.name === name);
    if (matches.length !== 1) throw new Error('Missing or duplicated native result group');
    const group = matches[0];
    validateGroup(group, expectedCounts[name]);
  }
}
