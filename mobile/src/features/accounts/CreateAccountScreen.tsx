import { Button, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateAccount } from './useCreateAccount';
export const schoolLabels = { grundschule: 'Grundschule St. Martin', mittelschule: 'Mittelschule St. Martin' };
export function CreateAccountScreen({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const form = useCreateAccount(onSaved, onCancel);
  const field = (name: 'childName' | 'username' | 'password', label: string) => <View style={{ gap: 6 }}>
    <Text>{label}</Text>
    <TextInput testID={`account-${name}`} accessibilityLabel={label} value={form.input[name]} onChangeText={value => form.change(name, value)}
      editable={!form.busy} secureTextEntry={name === 'password'} autoCorrect={false}
      autoCapitalize={name === 'childName' ? 'words' : 'none'} autoComplete="off"
      style={{ borderWidth: 1, borderColor: '#666', borderRadius: 6, padding: 12, color: '#111', backgroundColor: '#fff' }} />
    {form.errors[name] ? <Text accessibilityRole="alert">{form.errors[name]}</Text> : null}
  </View>;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 24, gap: 20 }}>
      <Text accessibilityRole="header" style={{ fontSize: 24 }}>Schulkonto hinzufügen</Text>
      <Text>Das Konto wird auf diesem Gerät gespeichert. Die Anmeldung bei der Schule wird hier noch nicht geprüft.</Text>
      {field('childName', 'Kind')}
      <Text>Schule</Text>
      {(['grundschule', 'mittelschule'] as const).map(code => <View key={code} accessibilityRole="radio" accessibilityState={{ checked: form.input.schoolCode === code, disabled: form.busy }}>
        <Button testID={`account-school-${code}`} title={`${form.input.schoolCode === code ? '✓ ' : ''}${schoolLabels[code]}`} disabled={form.busy} onPress={() => form.change('schoolCode', code)} />
      </View>)}
      {form.errors.schoolCode ? <Text accessibilityRole="alert">{form.errors.schoolCode}</Text> : null}
      {field('username', 'Benutzername')}{field('password', 'Passwort')}
      {form.message ? <Text accessibilityRole="alert">{form.message}</Text> : null}
      <Button testID="account-save" title={form.busy ? 'Wird gespeichert …' : 'Speichern'} disabled={form.busy} onPress={() => { void form.submit(); }} />
      <Button testID="account-cancel" title="Zurück" disabled={form.busy} onPress={form.cancel} />
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
