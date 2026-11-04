import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { StorageError } from './errors';
export const KEY_NAME = 'familyhub.database.key.v1';
export interface KeyRecord { format_version: 1; installation_id: string; key: string }
export interface KeyStore {
  read(): Promise<KeyRecord | null>;
  provision(installationId: string): Promise<KeyRecord>;
}
const options: SecureStore.SecureStoreOptions = {
  keychainService: 'familyhub.database',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};
export function parseKey(raw: string): KeyRecord {
  try {
    const v = JSON.parse(raw) as KeyRecord;
    if (v.format_version !== 1 || typeof v.installation_id !== 'string' ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(v.installation_id) || !/^[0-9a-f]{64}$/.test(v.key)) throw new Error();
    return v;
  } catch { throw new StorageError('key-mismatch'); }
}
export const platformKeys: KeyStore = {
  async read() {
    let raw: string | null;
    try { raw = await SecureStore.getItemAsync(KEY_NAME, options); }
    catch { throw new StorageError('key-unavailable'); }
    return raw === null ? null : parseKey(raw);
  },
  async provision(installationId) {
    try {
      const bytes = await Crypto.getRandomBytesAsync(32);
      const key = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      bytes.fill(0);
      const value: KeyRecord = { format_version: 1, installation_id: installationId, key };
      await SecureStore.setItemAsync(KEY_NAME, JSON.stringify(value), options);
      const saved = await platformKeys.read();
      if (!saved || saved.installation_id !== installationId || saved.key !== key) throw new Error();
      return saved;
    } catch { throw new StorageError('key-unavailable'); }
  },
};
