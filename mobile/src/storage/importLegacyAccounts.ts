import type { LegacyAccount, MigrationState } from '../features/accounts/types';
import { schools } from '../features/accounts/types';
import { childIdentity, isBlank, trimChildName } from './childIdentity';
import type { AccountDatabase } from './database';
import type { LegacySnapshot } from './legacySource';
import { StorageError } from './errors';
export function validateSnapshot(source: LegacySnapshot): void {
  if (source.sourceVersion !== 1) throw new StorageError('legacy');
  const ids = new Set<number>(), children = new Set<string>();
  for (const account of source.accounts) {
    if (!Number.isSafeInteger(account.id) || account.id <= 0 || ids.has(account.id) ||
        typeof account.childDisplayName !== 'string' || isBlank(account.childDisplayName) ||
        trimChildName(account.childDisplayName) !== account.childDisplayName ||
        account.childKey !== childIdentity(account.childDisplayName) || children.has(account.childKey) ||
        !schools.includes(account.schoolCode) || typeof account.username !== 'string' || isBlank(account.username) ||
        typeof account.password !== 'string' || isBlank(account.password)) throw new StorageError('legacy');
    ids.add(account.id); children.add(account.childKey);
  }
}
export async function migrationState(database: AccountDatabase): Promise<MigrationState | null> {
  return database.read(c => c.getFirstAsync<MigrationState>('SELECT source_version, account_count, status FROM legacy_migration WHERE id=1'));
}
export async function importLegacyAccounts(database: AccountDatabase, source: LegacySnapshot): Promise<void> {
  validateSnapshot(source);
  await database.transaction(async connection => {
    if (await connection.getFirstAsync('SELECT id FROM legacy_migration WHERE id=1')) return;
    const count = await connection.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM school_accounts');
    if (count?.total !== 0) throw new StorageError('legacy');
    for (const a of source.accounts) {
      await connection.runAsync('INSERT INTO school_accounts (id,child_display_name,child_key,school_code,username,password) VALUES (?,?,?,?,?,?)',
        a.id, a.childDisplayName, a.childKey, a.schoolCode, a.username, a.password);
    }
    await connection.runAsync("INSERT INTO legacy_migration (id,source_version,account_count,status) VALUES (1,1,?,'imported')", source.accounts.length);
  });
}
export function sameAccount(a: LegacyAccount, b: LegacyAccount): boolean {
  return a.id === b.id && a.childDisplayName === b.childDisplayName && a.childKey === b.childKey &&
    a.schoolCode === b.schoolCode && a.username === b.username && a.password === b.password;
}
