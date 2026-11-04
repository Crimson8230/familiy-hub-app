import { describe, expect, it } from '@jest/globals';
import { parseMarker, selectBootstrapMode, type Files, type Marker } from '../../src/storage/installationMarker';

const ready: Marker = { format_version: 1, installation_id: 'test-install', phase: 'ready' };
const base: Files = { database: false, orphanedFiles: false, marker: null, legacy: false };
describe('bootstrap preserves existing or inconsistent data', () => {
  it('requires a marker when a target database exists', () => {
    expect(() => selectBootstrapMode({ ...base, database: true })).toThrow();
  });
  it('opens an existing database before considering old Android data', () => {
    expect(selectBootstrapMode({ ...base, database: true, marker: ready, legacy: true })).toBe('existing');
  });
  it('does not silently recreate a database missing after ready', () => {
    expect(() => selectBootstrapMode({ ...base, marker: ready })).toThrow();
  });
  it('resumes provisioning rather than discarding its matching key', () => {
    expect(selectBootstrapMode({ ...base, marker: { ...ready, phase: 'provisioning' } })).toBe('resume');
  });
  it('validates legacy source before creating a fresh target', () => {
    expect(selectBootstrapMode({ ...base, legacy: true })).toBe('legacy');
  });
  it('does not treat orphaned SQLite files as a new installation', () => {
    expect(() => selectBootstrapMode({ ...base, orphanedFiles: true })).toThrow();
  });
  it('permits a genuinely empty fresh install', () => {
    expect(selectBootstrapMode(base)).toBe('fresh');
  });
});

describe('marker validation', () => {
  it.each(['{', 'null', '{}', '{"format_version":2}', '{"format_version":1,"installation_id":"../x","phase":"ready"}'])('rejects corrupt markers', raw => {
    expect(() => parseMarker(raw)).toThrow();
  });
  it('retains a known valid marker', () => {
    expect(parseMarker(JSON.stringify(ready))).toEqual(ready);
  });
});
