export const schools = ['grundschule', 'mittelschule'] as const;
export type SchoolCode = typeof schools[number];
export interface AccountSummary { id: number; childDisplayName: string; schoolCode: SchoolCode }
export interface LegacyAccount extends AccountSummary { childKey: string; username: string; password: string }
export type MigrationState = { source_version: number; account_count: number; status: 'imported' | 'complete' };
