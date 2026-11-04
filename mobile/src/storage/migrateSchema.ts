import type { AccountDatabase } from './database';
import { initialSchema } from './generated/schema';
import { StorageError } from './errors';
export async function migrateSchema(database: AccountDatabase): Promise<void> {
  await database.transaction(async connection => {
    const row = await connection.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (!row || row.user_version < 0 || row.user_version > 1) throw new StorageError('schema');
    if (row.user_version === 0) {
      const tables = await connection.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (tables.length !== 0) throw new StorageError('schema');
      await connection.execAsync(initialSchema);
      await connection.execAsync('PRAGMA user_version=1');
    }
    // Fail if a supposedly supported schema has missing required columns.
    const columns = await connection.getAllAsync<{ name: string }>('PRAGMA table_info(school_accounts)');
    const expected = ['id', 'child_display_name', 'child_key', 'school_code', 'username', 'password'];
    if (columns.length !== expected.length || expected.some(name => !columns.some(c => c.name === name))) {
      throw new StorageError('schema');
    }
  });
}
