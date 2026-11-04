import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { LegacySource } from '../../src/storage/legacySource';
import { StorageError } from '../../src/storage/errors';
const native = requireOptionalNativeModule<LegacySource>('LegacyAccounts');
const absent: LegacySource = {
  exists: async () => false, snapshot: async () => null,
  removeDatabase: async () => {}, removeKey: async () => {},
};
export default new Proxy(absent, {
  get(target, key: keyof LegacySource) {
    if (Platform.OS === 'ios') return target[key];
    if (!native) return async () => { throw new StorageError('legacy'); };
    return native[key].bind(native);
  },
}) as LegacySource;
