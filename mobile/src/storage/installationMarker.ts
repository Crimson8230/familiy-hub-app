import { StorageError } from './errors';
export type Marker = { format_version: 1; installation_id: string; phase: 'provisioning' | 'ready' };
export type Files = { database: boolean; orphanedFiles: boolean; marker: Marker | null; legacy: boolean };
export function parseMarker(raw: string | null): Marker | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Partial<Marker>;
    if (value.format_version !== 1 || typeof value.installation_id !== 'string' ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(value.installation_id) ||
        !['provisioning', 'ready'].includes(value.phase ?? '')) throw new Error();
    return value as Marker;
  } catch { throw new StorageError('inconsistent'); }
}
export function selectBootstrapMode(files: Files): 'existing' | 'resume' | 'fresh' | 'legacy' {
  if (files.orphanedFiles) throw new StorageError('inconsistent');
  if (files.database) {
    if (!files.marker) throw new StorageError('inconsistent');
    return 'existing';
  }
  if (files.marker?.phase === 'ready') throw new StorageError('inconsistent');
  if (files.marker?.phase === 'provisioning') return 'resume';
  return files.legacy ? 'legacy' : 'fresh';
}
