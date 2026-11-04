import { describe, expect, it } from '@jest/globals';
import { validateSnapshot } from '../../src/storage/importLegacyAccounts';
import type { LegacyAccount } from '../../src/features/accounts/types';
const account: LegacyAccount = {
  id: 1, childDisplayName: 'Änna', childKey: 'änna', schoolCode: 'grundschule',
  username: ' user ', password: ' pass ',
};
describe('legacy migration rejects unsafe input without rewriting credentials', () => {
  it('preserves access values including surrounding whitespace', () => {
    const before = { ...account };
    validateSnapshot({ sourceVersion: 1, accounts: [account] });
    expect(account).toEqual(before);
  });
  it('accepts a known empty source without any credentials', () => {
    expect(() => validateSnapshot({ sourceVersion: 1, accounts: [] })).not.toThrow();
  });
  it.each([
    { id: Number.MAX_SAFE_INTEGER + 1 }, { id: 0 }, { childKey: 'different' },
    { schoolCode: 'unknown' }, { password: '  ' }, { childDisplayName: ' Änna' },
  ])('rejects invalid or incompatible identity fields', patch => {
    expect(() => validateSnapshot({ sourceVersion: 1, accounts: [{ ...account, ...patch } as LegacyAccount] })).toThrow();
  });
  it('rejects duplicate IDs and duplicate normalized children', () => {
    for (const second of [{ ...account, id: 2 }, { ...account, childDisplayName: 'Ben', childKey: 'ben' }]) {
      expect(() => validateSnapshot({ sourceVersion: 1, accounts: [account, second] })).toThrow();
    }
  });
});
