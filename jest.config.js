/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '<rootDir>/tools/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|immer|zustand|fflate)',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/morph/**/*.ts',
    'src/utils/**/*.ts',
    'src/dict/**/*.ts',
    'src/i18n.ts',
    'src/game/**/*.ts',
    '!**/*.test.ts',
    '!**/*.fixture.ts',
    '!**/index.ts',
  ],
  coverageThreshold: {
    './src/morph/': { statements: 95, branches: 95, functions: 95, lines: 95 },
    './src/utils/': { statements: 95, branches: 95, functions: 95, lines: 95 },
    './src/dict/': { statements: 95, branches: 95, functions: 95, lines: 95 },
    './src/game/': { statements: 90, branches: 85, functions: 90, lines: 90 },
  },
};
