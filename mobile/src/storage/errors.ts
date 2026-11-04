export type StorageErrorCode = 'inconsistent' | 'key-unavailable' | 'key-mismatch' | 'cipher-unavailable' | 'database' | 'schema' | 'legacy' | 'duplicate';
export class StorageError extends Error {
  constructor(readonly code: StorageErrorCode) {
    super('Gespeicherte Konten konnten nicht geöffnet werden. Bitte erneut versuchen.');
    this.name = 'StorageError';
  }
}
