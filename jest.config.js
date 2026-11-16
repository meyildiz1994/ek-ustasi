/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/morph/**/*.ts',
    'src/utils/**/*.ts',
    'src/i18n.ts',
    '!**/*.test.ts',
    '!**/index.ts',
  ],
  coverageThreshold: {
    './src/morph/': { statements: 95, branches: 95, functions: 95, lines: 95 },
    './src/utils/': { statements: 95, branches: 95, functions: 95, lines: 95 },
  },
};
