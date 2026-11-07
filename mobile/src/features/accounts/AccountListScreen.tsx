import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, AppState, Button, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountStorage } from '../../storage/StorageProvider';
import { listAccounts } from './accountRepository';
import { schoolLabels } from './CreateAccountScreen';
import type { AccountSummary } from './types';
export function AccountListScreen({ onAdd }: { onAdd: () => void }) {
  const database = useAccountStorage();
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current; setFailed(false); setAccounts(null);
    try { const rows = await listAccounts(database); if (version.current === current) setAccounts(rows); }
    catch { if (version.current === current) setFailed(true); }
  }, [database]);
  useFocusEffect(useCallback(() => {
    void load();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { version.current++; listener.remove(); };
  }, [load]));
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 24, gap: 20 }}>
    <Text accessibilityRole="header" style={{ fontSize: 24 }}>Schulkonten</Text>
    {failed ? <View><Text accessibilityRole="alert">Gespeicherte Konten konnten nicht geladen werden.</Text><Button title="Erneut versuchen" onPress={load} /></View>
      : accounts === null ? <ActivityIndicator accessibilityLabel="Konten werden geladen" />
      : accounts.length === 0 ? <Text>Noch keine Schulkonten gespeichert. Füge ein Schulkonto hinzu.</Text>
      : accounts.map(account => <View key={account.id} style={{ gap: 6 }}><Text>{account.childDisplayName}</Text><Text>{schoolLabels[account.schoolCode]}</Text></View>)}
    <Button testID="account-add" title="Schulkonto hinzufügen" onPress={onAdd} />
    </ScrollView>
  </SafeAreaView>;
}
