import { Stack } from 'expo-router';
import { StorageProvider } from '../storage/StorageProvider';
export default function RootLayout() {
  return <StorageProvider><Stack screenOptions={{ title: 'Family Hub' }} /></StorageProvider>;
}
