// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'coverage/*', 'node_modules/*', '.expo/*'],
  },
  {
    // Section 0 / 18: never use locale-unaware case conversion. Use trUpper / trLower.
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toUpperCase']",
          message: 'toUpperCase() yasak: src/utils/tr.ts içindeki trUpper() kullan.',
        },
        {
          selector: "CallExpression[callee.property.name='toLowerCase']",
          message: 'toLowerCase() yasak: src/utils/tr.ts içindeki trLower() kullan.',
        },
      ],
    },
  },
]);
