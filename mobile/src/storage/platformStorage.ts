import * as Crypto from 'expo-crypto';
import files from '../../modules/storage-policy';
import legacy from '../../modules/legacy-accounts';
import { platformKeys } from './databaseKey';
import { createDatabase } from './database';
import { createBootstrap } from './bootstrap';
export const openAccountStorage = createBootstrap({
  files, legacy, keys: platformKeys, uuid: () => Crypto.randomUUID(),
  database: (directory, installationId) => createDatabase(directory, installationId, platformKeys, () => files.protect()),
});
