import type { AccountDatabase } from '../../src/storage/database';
import { AccountError, createAccount, listAccounts } from '../../src/features/accounts/accountRepository';
import type { AccountInput } from '../../src/features/accounts/accountValidation';
import { StorageError } from '../../src/storage/errors';
import { check } from './faultInjection';
import scenarios from './scenarios.json';
import type { NativeCase } from './suite';
export const creationCases: NativeCase[] = scenarios.creation.map(name => ({ name, run: context => context.creationScenario(name) }));
const input = (name = 'Anna'): AccountInput => ({ childName: name, schoolCode: 'grundschule', username: ' user ', password: ' pass ' });
export async function runCreationScenario(name: string, db: AccountDatabase, resuming: boolean, restart: () => Promise<never>) {
  const count = async () => (await listAccounts(db)).length;
  if (name === 'creation-before-commit' || name === 'creation-after-commit') {
    if (!resuming) {
      const interrupted: AccountDatabase = { read: work => db.read(work), transaction: async work => {
        const result = await db.transaction(async c => { const value = await work(c); if (name === 'creation-before-commit') await restart(); return value; });
        await restart(); return result;
      } };
      await createAccount(interrupted, input());
    }
    check(await count() === (name === 'creation-after-commit' ? 1 : 0), name);
    return;
  }
  if (name === 'creation-ten-and-reopen') {
    for (let i = 0; i < 10; i++) await createAccount(db, input(`Kind ${i}`));
    const rows = await listAccounts(db); check(rows.length === 10, name);
    check(rows.every(row => Object.keys(row).sort().join(',') === 'childDisplayName,id,schoolCode'), name);
    return; // Every operation reopens the actual keyed database connection.
  }
  if (name === 'creation-concurrent-duplicates') {
    const results = await Promise.allSettled(['Anna', ' anna ', 'ANNA'].map(child => createAccount(db, input(child))));
    check(results.filter(result => result.status === 'fulfilled').length === 1 && await count() === 1, name);
    check(results.filter(result => result.status === 'rejected').every(result => result.status === 'rejected' && result.reason instanceof AccountError && result.reason.code === 'duplicate'), name);
    return;
  }
  if (name === 'creation-rollback' || name === 'creation-ambiguous-commit') {
    const broken: AccountDatabase = { read: work => db.read(work), transaction: async work => {
      if (name === 'creation-rollback') return db.transaction(async c => { await work(c); throw new StorageError('database'); });
      await db.transaction(work); throw new StorageError('database');
    } };
    let saved = false;
    try { await createAccount(broken, input()); saved = true; } catch (error) { check(error instanceof AccountError && error.code === 'save', name); }
    check(saved === (name === 'creation-ambiguous-commit') && await count() === (saved ? 1 : 0), name);
    return;
  }
  if (name === 'creation-long-credentials') {
    const value = { ...input(), username: ' ü'.repeat(40000), password: ' 密'.repeat(40000) };
    const id = await createAccount(db, value);
    const row = await db.read(c => c.getFirstAsync<{ username: string; password: string }>('SELECT username,password FROM school_accounts WHERE id=?', id));
    check(row?.username === value.username && row.password === value.password, name); return;
  }
  // Runtime supplies a real database whose key/cipher boundary is deliberately unavailable.
  let failed = false;
  try { await createAccount(db, input()); } catch (error) { failed = error instanceof AccountError && error.code === 'save'; }
  check(failed, name);
}
