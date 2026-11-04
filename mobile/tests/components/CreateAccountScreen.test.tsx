import { beforeEach, test, expect, jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CreateAccountScreen } from '../../src/features/accounts/CreateAccountScreen';
import { createAccount, AccountError } from '../../src/features/accounts/accountRepository';
jest.mock('../../src/storage/StorageProvider', () => ({ useAccountStorage: () => ({}) }));
jest.mock('../../src/features/accounts/accountRepository', () => ({
  createAccount: jest.fn(), AccountError: class extends Error { code: string; constructor(code: string) { super(code); this.code = code; } },
}));
const save = jest.mocked(createAccount);
const fill = async () => {
  await fireEvent.changeText(screen.getByLabelText('Kind'), 'Anna');
  await fireEvent.press(screen.getByText('Mittelschule St. Martin'));
  await fireEvent.changeText(screen.getByLabelText('Benutzername'), ' user ');
  await fireEvent.changeText(screen.getByLabelText('Passwort'), ' pass ');
};
beforeEach(() => { save.mockReset(); });
test('field errors, school selection and hidden password', async () => {
  await render(<CreateAccountScreen onSaved={jest.fn()} onCancel={jest.fn()} />);
  expect(screen.getByLabelText('Passwort').props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByText('Speichern'));
  expect(screen.getByText('Bitte gib einen Namen für das Kind ein.')).toBeTruthy();
  expect(screen.getByText('Bitte wähle eine Schule.')).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
});
test('prevents double submission and returns only after commit, clearing secrets', async () => {
  let complete!: (value: number) => void;
  save.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  const done = jest.fn();
  await render(<CreateAccountScreen onSaved={done} onCancel={jest.fn()} />);
  await fill(); const button = screen.getByText('Speichern'); await fireEvent.press(button); await fireEvent.press(button);
  expect(save).toHaveBeenCalledTimes(1); expect(done).not.toHaveBeenCalled();
  expect(save.mock.calls[0][1]).toMatchObject({ schoolCode: 'mittelschule', username: ' user ', password: ' pass ' });
  await act(async () => { complete(1); });
  await waitFor(() => expect(done).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText('Benutzername').props.value).toBe('');
  expect(screen.getByLabelText('Passwort').props.value).toBe('');
});
test.each(['duplicate', 'save'])('safe %s error retains form for retry', async code => {
  save.mockRejectedValue(new AccountError(code as 'duplicate' | 'save'));
  await render(<CreateAccountScreen onSaved={jest.fn()} onCancel={jest.fn()} />);
  await fill(); await fireEvent.press(screen.getByText('Speichern'));
  await waitFor(() => expect(screen.getByText(code === 'duplicate' ? 'Für dieses Kind gibt es bereits ein Schulkonto.' : 'Das Konto konnte nicht gespeichert werden. Bitte versuche es erneut.')).toBeTruthy());
  expect(screen.getByLabelText('Passwort').props.value).toBe(' pass ');
  expect(screen.queryByText(' pass ')).toBeNull();
});
test('cancel clears credentials before navigation', async () => {
  const cancel = jest.fn();
  await render(<CreateAccountScreen onSaved={jest.fn()} onCancel={cancel} />);
  await fill(); await fireEvent.press(screen.getByText('Zurück'));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Passwort').props.value).toBe('');
});
test('leaving and reopening starts with fresh local inputs', async () => {
  const first = await render(<CreateAccountScreen onSaved={jest.fn()} onCancel={jest.fn()} />);
  await fill();
  await first.unmount();
  await render(<CreateAccountScreen onSaved={jest.fn()} onCancel={jest.fn()} />);
  expect(screen.getByLabelText('Benutzername').props.value).toBe('');
  expect(screen.getByLabelText('Passwort').props.value).toBe('');
});
