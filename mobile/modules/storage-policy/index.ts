import { requireNativeModule } from 'expo-modules-core';
import type { StorageFiles } from '../../src/storage/bootstrap';
export default requireNativeModule<StorageFiles>('StoragePolicy');
