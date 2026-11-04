import { childIdentity, isBlank, trimChildName } from '../../storage/childIdentity';
import { schools, type SchoolCode } from './types';
export interface AccountInput { childName: string; schoolCode: string; username: string; password: string }
export type FieldErrors = Partial<Record<keyof AccountInput, string>>;
export interface ValidAccount { childDisplayName: string; childKey: string; schoolCode: SchoolCode; username: string; password: string }
export function validateAccount(input: AccountInput): { value?: ValidAccount; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (isBlank(input.childName)) errors.childName = 'Bitte gib einen Namen für das Kind ein.';
  if (!schools.includes(input.schoolCode as SchoolCode)) errors.schoolCode = 'Bitte wähle eine Schule.';
  if (isBlank(input.username)) errors.username = 'Bitte gib einen Benutzernamen ein.';
  if (isBlank(input.password)) errors.password = 'Bitte gib ein Passwort ein.';
  if (Object.keys(errors).length) return { errors };
  return { errors, value: { childDisplayName: trimChildName(input.childName), childKey: childIdentity(input.childName),
    schoolCode: input.schoolCode as SchoolCode, username: input.username, password: input.password } };
}
