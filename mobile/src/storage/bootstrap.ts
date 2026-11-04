import type { AccountDatabase } from './database';
import type { KeyStore } from './databaseKey';
import type { LegacySource } from './legacySource';
import { parseMarker, selectBootstrapMode, type Marker } from './installationMarker';
import { migrateSchema } from './migrateSchema';
import { importLegacyAccounts, migrationState, validateSnapshot } from './importLegacyAccounts';
import { finalizeLegacyMigration } from './finalizeLegacyMigration';
import { StorageError } from './errors';
export interface StorageFiles {
  inspect(): Promise<{ directory: string; database: boolean; orphanedFiles: boolean; marker: string | null }>;
  writeMarker(raw: string): Promise<void>;
  protect(): Promise<void>;
}
export interface StorageDependencies {
  files: StorageFiles; keys: KeyStore; legacy: LegacySource; uuid(): string;
  database(directory: string, installationId: string): AccountDatabase;
}
export function createBootstrap(deps: StorageDependencies): () => Promise<AccountDatabase> {
  let pending: Promise<AccountDatabase> | undefined;
  return () => {
    if (!pending) pending = initialize(deps).catch(error => {
      pending = undefined;
      throw error instanceof StorageError ? error : new StorageError('database');
    });
    return pending;
  };
}
async function initialize(deps: StorageDependencies): Promise<AccountDatabase> {
  const state = await deps.files.inspect();
  let marker = parseMarker(state.marker);
  const legacyExists = await deps.legacy.exists();
  const mode = selectBootstrapMode({ ...state, marker, legacy: legacyExists });
  if (mode === 'legacy') {
    const source = await deps.legacy.snapshot();
    if (!source) throw new StorageError('legacy');
    validateSnapshot(source);
  }
  if (!marker) {
    marker = { format_version: 1, installation_id: deps.uuid(), phase: 'provisioning' };
    await deps.files.writeMarker(JSON.stringify(marker));
  }
  let record = await deps.keys.read();
  if (mode === 'existing' && (!record || record.installation_id !== marker.installation_id)) {
    throw new StorageError('key-mismatch');
  }
  if (!record || record.installation_id !== marker.installation_id) record = await deps.keys.provision(marker.installation_id);
  if (record.installation_id !== marker.installation_id) throw new StorageError('key-mismatch');
  const database = deps.database(state.directory, marker.installation_id);
  await migrateSchema(database);
  if (marker.phase !== 'ready') {
    marker = { ...marker, phase: 'ready' };
    await deps.files.writeMarker(JSON.stringify(marker));
  }
  const migration = await migrationState(database);
  if (migration?.status === 'complete') return database;
  if (!migration && legacyExists) {
    const source = await deps.legacy.snapshot();
    if (!source) throw new StorageError('legacy');
    await importLegacyAccounts(database, source);
  }
  await finalizeLegacyMigration(database, deps.legacy);
  await deps.files.protect();
  return database;
}
