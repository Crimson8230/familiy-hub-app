import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { bootstrapCases } from './storageBootstrap.test';
import { legacyCases } from './legacyMigration.test';
import { nativeContext } from './nativeContext';
import { control, report } from './faultInjection';
import { StorageError } from '../../src/storage/errors';
let running = false;
export default function NativeTestRunner() {
  const [status, setStatus] = useState('Native storage tests');
  useEffect(() => {
    if (running) return;
    running = true;
    const execute = async () => {
      const previousRaw = await control('readReport');
      const previous = previousRaw ? JSON.parse(previousRaw) : null;
      if (!previous || !['request', 'restart'].includes(previous.state)) {
        setStatus('Waiting for native test host');
        return;
      }
      if (previous?.mode === 'intentional-failure') {
        await report({ state: 'complete', passed: 0, failed: 1, skipped: 0 });
        setStatus('Intentional failure probe'); return;
      }
      const availableCases = Platform.OS === 'android' ? [...bootstrapCases, ...legacyCases] : bootstrapCases;
      const selectedCase = previous.selectedCase;
      const cases = selectedCase ? availableCases.filter(current => current.name === selectedCase) : availableCases;
      if (cases.length === 0) throw new Error('Unknown test scenario');
      const publish = (value: Record<string, unknown>) => report({ ...value, ...(selectedCase ? { selectedCase } : {}) });
      let passed = previous?.state === 'restart' ? previous.passed : 0;
      const start = previous?.state === 'restart' ? previous.index : 0;
      for (let index = start; index < cases.length; index++) {
        const current = cases[index];
        setStatus(`${index + 1}/${cases.length}: ${current.name}`);
        await publish({ state: 'running', index, passed, failed: 0, skipped: 0 });
        const context = nativeContext(previous?.state === 'restart' && index === start ? current.name : null,
          async name => {
            await publish({ state: 'restart', index, name, passed, failed: 0, skipped: 0 });
            return new Promise<never>(() => {});
          });
        try { await current.run(context); passed++; }
        catch (error) {
          const reason = error instanceof StorageError ? `storage-${error.code}` : 'test-operation';
          const candidate = (error as { testStage?: unknown })?.testStage;
          const stage = typeof candidate === 'string' && /^(target-bootstrap|legacy-(exists|snapshot|remove-database|remove-key))$/.test(candidate) ? candidate : undefined;
          await publish({ state: 'complete', index, name: current.name, reason, stage, passed, failed: 1, skipped: 0 });
          setStatus(`Failed: ${current.name}`); return;
        }
      }
      await publish({ state: 'complete', passed, failed: 0, skipped: 0 });
      setStatus(`${passed} native scenarios passed`);
    };
    execute().catch(async () => {
      await report({ state: 'complete', passed: 0, failed: 1, skipped: 0 }).catch(() => {});
      setStatus('Native test infrastructure failed');
    });
  }, []);
  return <View style={{ padding: 24 }}><Text>{status}</Text></View>;
}
