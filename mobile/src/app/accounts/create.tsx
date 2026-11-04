import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { CreateAccountScreen } from '../../features/accounts/CreateAccountScreen';
export default function CreateAccountRoute() {
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const leave = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  return <><Stack.Screen options={{ title: 'Schulkonto hinzufügen' }} />
    {focused ? <CreateAccountScreen onSaved={leave} onCancel={leave} /> : null}</>;
}
