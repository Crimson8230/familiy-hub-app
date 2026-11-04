import scenarios from './scenarios.json';
import type { NativeCase } from './suite';
export const bootstrapCases: NativeCase[] = scenarios.storage.map(name => ({ name, run: context => context.storageScenario(name) }));
