import type { AccountDatabase } from '../../storage/database';
import { StorageError } from '../../storage/errors';
import { validateAccount, type AccountInput } from './accountValidation';
import type { AccountSummary } from './types';
export class AccountError extends Error {
  constructor(public readonly code: 'duplicate' | 'save' | 'invalid') { super(code); }
}
export async function listAccounts(database: AccountDatabase): Promise<AccountSummary[]> {
  return database.read(c => c.getAllAsync<AccountSummary>(
    'SELECT id, child_display_name AS childDisplayName, school_code AS schoolCode FROM school_accounts ORDER BY id'));
}
export async function createAccount(database: AccountDatabase, input: AccountInput): Promise<number> {
  const { value } = validateAccount(input);
  if (!value) throw new AccountError('invalid');
  let duplicate = false;
  let insertedId: number | undefined;
  try {
    return await database.transaction(async c => {
      // The exclusive transaction prevents a competing writer between check and INSERT.
      if (await c.getFirstAsync('SELECT id FROM school_accounts WHERE child_key=?', value.childKey)) {
        duplicate = true;
        throw new StorageError('duplicate');
      }
      const result = await c.runAsync('INSERT INTO school_accounts (child_display_name,child_key,school_code,username,password) VALUES (?,?,?,?,?)',
        value.childDisplayName, value.childKey, value.schoolCode, value.username, value.password);
      insertedId = result.lastInsertRowId;
      return insertedId;
    });
  } catch {
    if (duplicate) throw new AccountError('duplicate');
    // COMMIT can succeed before a checkpoint/protection/transport failure. Read
    // back the exact attempted row, without issuing a second INSERT or exposing secrets.
    if (insertedId !== undefined) {
      try {
        const row = await database.read(c => c.getFirstAsync<{ id: number; child_key: string; child_display_name: string; school_code: string; username: string; password: string }>(
          'SELECT id,child_key,child_display_name,school_code,username,password FROM school_accounts WHERE id=?', insertedId!));
        if (row && row.child_key === value.childKey && row.child_display_name === value.childDisplayName && row.school_code === value.schoolCode && row.username === value.username && row.password === value.password) return row.id;
      } catch { /* retain an unresolved storage error; never claim success */ }
    }
    throw new AccountError('save');
  }
}
