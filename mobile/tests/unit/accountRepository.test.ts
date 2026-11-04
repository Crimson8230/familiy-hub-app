import { expect, jest, test } from '@jest/globals';
import { AccountError, createAccount } from '../../src/features/accounts/accountRepository';
import type { AccountDatabase, SqlSession } from '../../src/storage/database';
const input = { childName: 'Anna', schoolCode: 'grundschule', username: ' user ', password: ' pass ' };
function fixture() {
  const session = {
    execAsync: jest.fn<SqlSession['execAsync']>(),
    runAsync: jest.fn<SqlSession['runAsync']>().mockResolvedValue({ changes: 1, lastInsertRowId: 42 }),
    getAllAsync: jest.fn<SqlSession['getAllAsync']>(),
    getFirstAsync: jest.fn<SqlSession['getFirstAsync']>().mockResolvedValue(null),
  };
  // Jest's function mocks erase generic result types at this test boundary.
  const connection = session as unknown as SqlSession;
  const database: AccountDatabase = { transaction: work => work(connection), read: work => work(connection) };
  return { session, database, connection };
}
test('an unrelated SQL failure is a save failure, not a duplicate', async () => {
  const { session, database } = fixture();
  session.runAsync.mockRejectedValue(new Error('synthetic SQL fault'));
  await expect(createAccount(database, input)).rejects.toMatchObject({ code: 'save' });
});
test('an existing identity prevents insertion', async () => {
  const { session, database } = fixture();
  session.getFirstAsync.mockResolvedValue({ id: 7 });
  await expect(createAccount(database, input)).rejects.toMatchObject({ code: 'duplicate' });
  expect(session.runAsync).not.toHaveBeenCalled();
});
test('ambiguous commit cannot accept another row with changed credentials', async () => {
  const { session, database, connection } = fixture();
  database.transaction = async work => { await work(connection); throw new Error('synthetic transport fault'); };
  session.getFirstAsync.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 42, child_key: 'anna', child_display_name: 'Anna', school_code: 'grundschule', username: 'other', password: 'other' });
  await expect(createAccount(database, input)).rejects.toBeInstanceOf(AccountError);
  expect(session.runAsync).toHaveBeenCalledTimes(1);
});
