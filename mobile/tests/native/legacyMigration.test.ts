import scenarios from './scenarios.json';
import type { NativeCase } from './suite';
export const legacyCases: NativeCase[] = scenarios.legacy.map(name => ({ name, run: context => context.legacyScenario(name) }));
