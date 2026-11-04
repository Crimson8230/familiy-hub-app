import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Button, ScrollView, Text } from 'react-native';
import type { AccountDatabase } from './database';
const StorageContext = createContext<AccountDatabase | null>(null);
export function StorageProvider({ children }: { children: ReactNode }) {
  const [database, setDatabase] = useState<AccountDatabase | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false); setDatabase(null);
    import('./platformStorage').then(module => module.openAccountStorage()).then(value => {
      if (active) setDatabase(value);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  if (failed) return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
    <Text accessibilityRole="alert">Gespeicherte Konten konnten nicht geöffnet werden. Deine Daten werden nicht zurückgesetzt.</Text>
    <Button title="Erneut versuchen" onPress={() => setAttempt(value => value + 1)} />
  </ScrollView>;
  if (!database) return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
    <ActivityIndicator accessibilityLabel="Gespeicherte Konten werden geöffnet" />
    <Text>Gespeicherte Konten werden geöffnet …</Text>
  </ScrollView>;
  return <StorageContext.Provider value={database}>{children}</StorageContext.Provider>;
}
export function useAccountStorage(): AccountDatabase {
  const value = useContext(StorageContext);
  if (!value) throw new Error('Account storage is not ready');
  return value;
}
