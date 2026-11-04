import { router } from 'expo-router';
import { AccountListScreen } from '../features/accounts/AccountListScreen';

export default function Index() {
  return <AccountListScreen onAdd={() => router.push('/accounts/create')} />;
}
