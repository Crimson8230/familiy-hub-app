import type { LegacyAccount } from '../features/accounts/types';
import type { AccountDatabase } from './database';
import type { LegacySource } from './legacySource';
import { migrationState, sameAccount, validateSnapshot } from './importLegacyAccounts';
import { StorageError } from './errors';
export async function finalizeLegacyMigration(database: AccountDatabase, legacy: LegacySource): Promise<void> {
  const status = await migrationState(database);
  if (!status || status.status === 'complete') return;
  const source = await legacy.snapshot();
  if (source) validateSnapshot(source);
  // Every read opens the target afresh using the securely stored key.
  const target = await database.read(c => c.getAllAsync<LegacyAccount>(
    'SELECT id,child_display_name AS childDisplayName,child_key AS childKey,school_code AS schoolCode,username,password FROM school_accounts ORDER BY id'));
  if (target.length !== status.account_count) throw new StorageError('legacy');
  if (source) {
    const expected = [...source.accounts].sort((a, b) => a.id - b.id);
    if (target.length !== expected.length || target.some((a, i) => !sameAccount(a, expected[i]))) throw new StorageError('legacy');
  }
  // Idempotently remove surviving sidecars even if a previous cleanup already removed the main file.
  await legacy.removeDatabase();
  await legacy.removeKey();
  await database.transaction(c => c.runAsync("UPDATE legacy_migration SET status='complete' WHERE id=1").then(() => undefined));
}
