import type { LegacyAccount } from '../features/accounts/types';
export interface LegacySnapshot { sourceVersion: 1; accounts: LegacyAccount[] }
export interface LegacySource {
  exists(): Promise<boolean>;
  snapshot(): Promise<LegacySnapshot | null>;
  removeDatabase(): Promise<void>;
  removeKey(): Promise<void>;
}
