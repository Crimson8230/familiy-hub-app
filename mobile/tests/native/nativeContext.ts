import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import files from '../../modules/storage-policy';
import legacy from '../../modules/legacy-accounts';
import { createBootstrap, type StorageDependencies } from '../../src/storage/bootstrap';
import { createDatabase } from '../../src/storage/database';
import { platformKeys, KEY_NAME } from '../../src/storage/databaseKey';
import { StorageError } from '../../src/storage/errors';
import { childIdentity } from '../../src/storage/childIdentity';
import type { NativeTestContext } from './suite';
import { control, check } from './faultInjection';
const options = { keychainService: 'familyhub.database' };
const dependencies = (): StorageDependencies => ({
  files, keys: platformKeys, legacy, uuid: () => Crypto.randomUUID(),
  database: (directory, id) => createDatabase(directory, id, platformKeys, () => files.protect()),
});
const initialize = (deps = dependencies()) => createBootstrap(deps)();
async function failure(operation: () => Promise<unknown>): Promise<void> {
  let failed = false;
  try { await operation(); } catch (error) { failed = error instanceof StorageError; }
  check(failed, 'expected a sanitized storage failure');
}
async function reset(): Promise<void> {
  await control('reset');
  await SecureStore.deleteItemAsync(KEY_NAME, options);
}
export function nativeContext(resumeName: string | null, restart: (name: string) => Promise<never>): NativeTestContext {
  return {
    async storageScenario(name) {
      const resuming = resumeName === name;
      if (!resuming) await reset();
      const deps = dependencies();
      if (name.startsWith('crash-')) {
        if (!resuming) {
          const wanted = name;
          const originalFiles = deps.files;
          deps.files = { ...originalFiles,
            inspect: () => originalFiles.inspect(), protect: () => originalFiles.protect(),
            async writeMarker(raw) {
              const marker = JSON.parse(raw);
              if (wanted === 'crash-before-ready' && marker.phase === 'ready') await restart(name);
              await originalFiles.writeMarker(raw);
              if (wanted === 'crash-after-marker' && marker.phase === 'provisioning') await restart(name);
              if (wanted === 'crash-after-ready' && marker.phase === 'ready') await restart(name);
            },
          };
          deps.keys = { read: () => platformKeys.read(), async provision(id) {
            const result = await platformKeys.provision(id);
            if (wanted === 'crash-after-key') await restart(name);
            return result;
          } };
          if (wanted === 'crash-after-db') {
            const factory = deps.database;
            deps.database = (directory, id) => {
              const db = factory(directory, id);
              return { read: work => db.read(work), async transaction(work) {
                const result = await db.transaction(work); await restart(name); return result;
              } };
            };
          }
        }
        await initialize(deps);
        check(JSON.parse((await files.inspect()).marker!).phase === 'ready', name);
        return;
      }
      switch (name) {
        case 'fresh-marker-before-key': {
          deps.keys = { read: () => platformKeys.read(), async provision(id) {
            const marker = JSON.parse((await files.inspect()).marker!);
            check(marker.phase === 'provisioning' && marker.installation_id === id, name);
            return platformKeys.provision(id);
          } };
          await initialize(deps); return;
        }
        case 'matching-provisioning-key-reused':
        case 'foreign-provisioning-key-replaced':
        case 'missing-provisioning-key-created': {
          const id = Crypto.randomUUID();
          await files.writeMarker(JSON.stringify({ format_version: 1, installation_id: id, phase: 'provisioning' }));
          const previous = name.startsWith('missing') ? null : await platformKeys.provision(name.startsWith('foreign') ? 'foreign' : id);
          await initialize(); const current = await platformKeys.read();
          check(current?.installation_id === id, name);
          if (name.startsWith('matching')) check(current?.key === previous?.key, name);
          if (name.startsWith('foreign')) check(current?.key !== previous?.key, name);
          return;
        }
        case 'keychain-residue-without-files': {
          const previous = await platformKeys.provision('previous-install');
          await initialize(); check((await platformKeys.read())?.key !== previous.key, name); return;
        }
        case 'existing-db-key-missing':
        case 'existing-db-key-wrong':
        case 'existing-db-key-temporarily-locked':
        case 'existing-db-marker-missing':
        case 'corrupt-marker-preserved':
        case 'ready-without-db-rejected': {
          await initialize();
          if (name === 'existing-db-key-missing') await SecureStore.deleteItemAsync(KEY_NAME, options);
          if (name === 'existing-db-key-wrong') {
            const record = await platformKeys.read();
            await SecureStore.setItemAsync(KEY_NAME, JSON.stringify({ ...record, key: 'ff'.repeat(32) }), options);
          }
          if (name === 'existing-db-key-temporarily-locked') deps.keys = {
            read: async () => { throw new StorageError('key-unavailable'); }, provision: platformKeys.provision,
          };
          if (name === 'existing-db-marker-missing') await control('removeFile', { name: 'installation.json' });
          if (name === 'corrupt-marker-preserved') await control('writeFile', { name: 'installation.json', value: '{' });
          if (name === 'ready-without-db-rejected') await control('removeFile', { name: 'family_hub_v2.db' });
          const before = await files.inspect();
          await failure(() => initialize(deps));
          const after = await files.inspect();
          check(before.database === after.database && before.marker === after.marker, name); return;
        }
        case 'orphaned-wal-preserved': {
          await control('writeFile', { name: 'family_hub_v2.db-wal', value: 'synthetic orphan' });
          await failure(() => initialize()); check((await files.inspect()).orphanedFiles, name); return;
        }
        case 'sqlcipher-absent-fails-closed': {
          // Fault-injection boundary; real cipher presence is also exercised by every successful DB scenario.
          deps.database = () => { throw new StorageError('cipher-unavailable'); };
          await failure(() => initialize(deps)); check(!(await files.inspect()).database, name); return;
        }
        case 'unknown-schema-rejected': {
          const db = await initialize(); await db.transaction(c => c.execAsync('PRAGMA user_version=99'));
          await failure(() => initialize());
          check((await db.read(c => c.getFirstAsync<{ user_version: number }>('PRAGMA user_version')))?.user_version === 99, name); return;
        }
        case 'schema-rollback-preserves-accounts': {
          const db = await initialize();
          await db.transaction(c => c.runAsync('INSERT INTO school_accounts (child_display_name,child_key,school_code,username,password) VALUES (?,?,?,?,?)', 'Fixture', 'fixture', 'grundschule', 'fake-user', 'fake-pass').then(() => undefined));
          await failure(() => db.transaction(async c => {
            await c.execAsync('CREATE TABLE failed_schema_change (id INTEGER); PRAGMA user_version=2;');
            await c.runAsync('DELETE FROM school_accounts'); throw new StorageError('schema');
          }));
          check((await db.read(c => c.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM school_accounts')))?.total === 1, name);
          check((await db.read(c => c.getFirstAsync<{ user_version: number }>('PRAGMA user_version')))?.user_version === 1, name); return;
        }
        case 'unicode-identity-compatible': {
          check(childIdentity('  ÄNNA  ') === 'änna' && childIdentity('İ') === 'i̇' && childIdentity('\u001cAnna\u001c') === 'anna', name); return;
        }
        default: throw new Error('Undefined native storage scenario');
      }
    },
    async legacyScenario(name) {
      const resuming = resumeName === name;
      if (!resuming) { await reset(); await control('seedLegacy', { empty: name === 'legacy-empty-without-alias' }); }
      const deps = dependencies();
      let testStage = 'target-bootstrap';
      const trace = async <T,>(stage: string, work: () => Promise<T>): Promise<T> => {
        testStage = stage;
        const result = await work();
        testStage = 'target-bootstrap';
        return result;
      };
      const source = deps.legacy;
      deps.legacy = {
        exists: () => trace('legacy-exists', () => source.exists()),
        snapshot: () => trace('legacy-snapshot', () => source.snapshot()),
        removeDatabase: () => trace('legacy-remove-database', () => source.removeDatabase()),
        removeKey: () => trace('legacy-remove-key', () => source.removeKey()),
      };
      if (name === 'legacy-missing-key-preserves-source') await control('removeLegacyKey');
      if (name === 'legacy-unknown-schema-preserves-source') await control('mutateLegacy', { kind: 'schema' });
      if (name === 'legacy-unknown-format-preserves-source') await control('mutateLegacy', { kind: 'format' });
      if (name === 'legacy-child-key-conflict-preserves-source') await control('mutateLegacy', { kind: 'identity' });
      if (name.includes('preserves-source')) {
        await failure(() => initialize()); check(await legacy.exists(), name); return;
      }
      const restarting = ['legacy-before-import-commit', 'legacy-after-import-commit', 'legacy-after-source-deletion', 'legacy-after-alias-deletion', 'legacy-after-complete'];
      if (!resuming && restarting.includes(name)) {
        const original = deps.legacy;
        deps.legacy = { exists: () => original.exists(), snapshot: () => original.snapshot(),
          async removeDatabase() { await original.removeDatabase(); if (name === 'legacy-after-source-deletion') await restart(name); },
          async removeKey() { await original.removeKey(); if (name === 'legacy-after-alias-deletion') await restart(name); },
        };
        const factory = deps.database;
        deps.database = (directory, id) => {
          const db = factory(directory, id);
          return { read: work => db.read(work), async transaction(work) {
            const result = await db.transaction(async c => {
              const value = await work(c);
              const status = await c.getFirstAsync<{ status: string }>('SELECT status FROM legacy_migration WHERE id=1');
              if (status?.status === 'imported' && name === 'legacy-before-import-commit') await restart(name);
              return value;
            });
            const status = await db.read(c => c.getFirstAsync<{ status: string }>('SELECT status FROM legacy_migration WHERE id=1'));
            if (status?.status === 'imported' && name === 'legacy-after-import-commit') await restart(name);
            if (status?.status === 'complete' && name === 'legacy-after-complete') await restart(name);
            return result;
          } };
        };
      }
      const db = await initialize(deps).catch(error => {
        if (error instanceof StorageError) Object.assign(error, { testStage });
        throw error;
      });
      const expected = name === 'legacy-empty-without-alias' ? 0 : 10;
      check((await db.read(c => c.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM school_accounts')))?.total === expected, name);
      check(!(await legacy.exists()), name);
      if (name === 'legacy-deleted-account-never-reappears') {
        await db.transaction(c => c.runAsync('DELETE FROM school_accounts WHERE id=1').then(() => undefined));
        const reopened = await initialize();
        check((await reopened.read(c => c.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM school_accounts')))?.total === 9, name);
      }
    },
  };
}
