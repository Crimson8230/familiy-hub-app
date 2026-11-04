// This file is reachable only through the profile-specific test entry.
import { NativeModules } from 'react-native';
export async function control(command: string, value: Record<string, unknown> = {}): Promise<string | null> {
  const support = NativeModules.FamilyHubTestSupport;
  if (!support) throw new Error('Dedicated native test binary required');
  return support.control(command, JSON.stringify(value));
}
export async function report(value: Record<string, unknown>): Promise<void> { await control('report', value); }
export function check(value: unknown, name: string): asserts value {
  if (!value) throw new Error(`Native assertion failed: ${name}`);
}
