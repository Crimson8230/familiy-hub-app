import { describe, test, expect } from '@jest/globals';
import fixtures from '../fixtures/child-normalization.json';
import { childIdentity } from '../../src/storage/childIdentity';
import { validateAccount } from '../../src/features/accounts/accountValidation';
describe('account input', () => {
  test.each(fixtures)('Kotlin identity: $input', ({ input, display, key }) => {
    const result = validateAccount({ childName: input, schoolCode: 'grundschule', username: ' user ', password: ' pass ' });
    expect(result.value).toEqual({ childDisplayName: display, childKey: key, schoolCode: 'grundschule', username: ' user ', password: ' pass ' });
    expect(childIdentity(input)).toBe(key);
  });
  test.each(['', ' \t\n', '\u001c\u00a0\u2003'])('all blank fields are rejected', blank => {
    expect(validateAccount({ childName: blank, schoolCode: 'other', username: blank, password: blank })).toEqual({ errors: {
      childName: expect.any(String), schoolCode: expect.any(String), username: expect.any(String), password: expect.any(String),
    } });
  });
  test.each(['grundschule', 'mittelschule'])('allowed school %s', schoolCode => {
    expect(validateAccount({ childName: 'Lea', schoolCode, username: 'u', password: 'p' }).value?.schoolCode).toBe(schoolCode);
  });
});
