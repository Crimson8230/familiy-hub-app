import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccountListScreen } from '../../src/features/accounts/AccountListScreen';
import { listAccounts } from '../../src/features/accounts/accountRepository';
jest.mock('expo-router', () => ({ useFocusEffect: (effect: () => void) => { require('react').useEffect(effect, [effect]); } }));
jest.mock('../../src/storage/StorageProvider', () => {
  const database = {};
  return { useAccountStorage: () => database };
});
jest.mock('../../src/features/accounts/accountRepository', () => ({ listAccounts: jest.fn() }));
const list = jest.mocked(listAccounts);
beforeEach(() => { list.mockReset(); });
test('stored summaries show child and school and expose the add action', async () => {
  list.mockResolvedValue([{ id: 1, childDisplayName: 'Anna', schoolCode: 'grundschule' }]);
  const add = jest.fn();
  await render(<AccountListScreen onAdd={add} />);
  expect(await screen.findByText('Anna')).toBeTruthy();
  expect(screen.getByText('Grundschule St. Martin')).toBeTruthy();
  expect(screen.queryByLabelText('Passwort')).toBeNull();
  await fireEvent.press(screen.getByText('Schulkonto hinzufügen'));
  expect(add).toHaveBeenCalledTimes(1);
});
test('a read failure never appears as an empty account list; retry can recover', async () => {
  list.mockRejectedValueOnce(new Error('synthetic')).mockResolvedValueOnce([]);
  await render(<AccountListScreen onAdd={jest.fn()} />);
  expect(await screen.findByText('Gespeicherte Konten konnten nicht geladen werden.')).toBeTruthy();
  expect(screen.queryByText('Noch keine Schulkonten gespeichert. Füge ein Schulkonto hinzu.')).toBeNull();
  await fireEvent.press(screen.getByText('Erneut versuchen'));
  expect(await screen.findByText('Noch keine Schulkonten gespeichert. Füge ein Schulkonto hinzu.')).toBeTruthy();
});
