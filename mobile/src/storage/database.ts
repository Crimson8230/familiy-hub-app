import * as SQLite from 'expo-sqlite';
import type { KeyRecord, KeyStore } from './databaseKey';
import { StorageError } from './errors';
export type SqlValue = string | number | null | Uint8Array;
export interface SqlSession {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<SQLite.SQLiteRunResult>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}
export interface AccountDatabase {
  read<T>(work: (connection: SqlSession) => Promise<T>): Promise<T>;
  transaction<T>(work: (connection: SqlSession) => Promise<T>): Promise<T>;
}
// Every read/write owns a fresh keyed connection. Never expose it to concurrent UI calls.
export function createDatabase(directory: string, installationId: string, keys: KeyStore,
                               protect: () => Promise<void>): AccountDatabase {
  let tail: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
    const result = tail.then(work, work);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };
  async function use<T>(transaction: boolean, work: (connection: SqlSession) => Promise<T>): Promise<T> {
    let connection: SQLite.SQLiteDatabase | undefined;
    try {
      const record: KeyRecord | null = await keys.read();
      if (!record || record.installation_id !== installationId) throw new StorageError('key-mismatch');
      // useNewConnection also prevents registration with the SQLite devtools inspector.
      connection = await SQLite.openDatabaseAsync('family_hub_v2.db', { useNewConnection: true }, directory);
      const version = await connection.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
      if (!version?.cipher_version) throw new StorageError('cipher-unavailable');
      if (!/^[0-9a-f]{64}$/.test(record.key)) throw new StorageError('key-mismatch');
      // This string is generated hex, not user input. Never log it or SQL errors.
      await connection.execAsync(`PRAGMA key = "x'${record.key}'"`);
      const check = await connection.getFirstAsync<{ integrity_check: string }>('PRAGMA integrity_check');
      if (check?.integrity_check !== 'ok') throw new StorageError('database');
      const cipherCheck = await connection.getAllAsync('PRAGMA cipher_integrity_check');
      if (cipherCheck.length !== 0) throw new StorageError('database');
      await connection.execAsync('PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON; PRAGMA busy_timeout=5000;');
      await protect();
      if (transaction) await connection.execAsync('BEGIN EXCLUSIVE');
      try {
        const result = await work(connection);
        if (transaction) await connection.execAsync('COMMIT');
        if (transaction) await connection.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');
        await protect();
        return result;
      } catch (error) {
        if (transaction) { try { await connection.execAsync('ROLLBACK'); } catch { /* commit may have completed */ } }
        throw error;
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('database');
    } finally {
      if (connection) { try { await connection.closeAsync(); } catch { /* no secret-bearing raw error */ } }
    }
  }
  return {
    read: work => enqueue(() => use(false, work)),
    transaction: work => enqueue(() => use(true, work)),
  };
}
