import { afterEach, jest } from '@jest/globals';

// These component mocks are not evidence for native storage.
afterEach(() => { jest.restoreAllMocks(); });
