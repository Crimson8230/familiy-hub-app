module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/components/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/fixtures/', '/tests/native/'],
  clearMocks: true,
};
