import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccountStorage } from '../../storage/StorageProvider';
import { AccountError, createAccount } from './accountRepository';
import { validateAccount, type AccountInput, type FieldErrors } from './accountValidation';
const empty = (): AccountInput => ({ childName: '', schoolCode: '', username: '', password: '' });
export function useCreateAccount(onSaved: () => void, onCancel: () => void) {
  const database = useAccountStorage();
  const [input, setInput] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const clear = useCallback(() => { setInput(empty()); setErrors({}); setMessage(''); }, []);
  const cancel = useCallback(() => { if (!locked.current) { clear(); onCancel(); } }, [clear, onCancel]);
  async function submit() {
    if (locked.current) return;
    const result = validateAccount(input);
    setErrors(result.errors); setMessage('');
    if (!result.value) return;
    locked.current = true; setBusy(true);
    try {
      await createAccount(database, input);
      if (mounted.current) { clear(); onSaved(); }
    } catch (error) {
      if (mounted.current) setMessage(error instanceof AccountError && error.code === 'duplicate'
        ? 'Für dieses Kind gibt es bereits ein Schulkonto.'
        : 'Das Konto konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  return { input, errors, message, busy, submit, cancel,
    change: (field: keyof AccountInput, value: string) => { if (!locked.current) setInput(previous => ({ ...previous, [field]: value })); } };
}
