// Helper: build a `{ rule: 'off', ... }` object from a list of rule names.
const off = (...rules) => Object.fromEntries(rules.map(r => [r, 'off']))
// Helper: build a `{ rule: 'warn', ... }` object.
const warn = (...rules) => Object.fromEntries(rules.map(r => [r, 'warn']))

// Type-aware safety rules — require parserOptions.project so they run only in
// the TS override below (kept at 'warn' to surface issues without failing CI).
const TYPE_AWARE_SAFETY_RULES = [
  '@typescript-eslint/no-floating-promises',
  '@typescript-eslint/no-misused-promises',
  '@typescript-eslint/no-unsafe-assignment',
  '@typescript-eslint/no-unsafe-call',
  '@typescript-eslint/no-unsafe-return',
  '@typescript-eslint/no-unsafe-member-access'
  // Note: '@typescript-eslint/no-unsafe-argument' is unavailable in
  // @typescript-eslint/eslint-plugin@2.x — re-enable once the plugin is upgraded.
]

// Type-aware rules we deliberately silence (would also need parserOptions.project).
const TYPE_AWARE_DISABLED = [
  '@typescript-eslint/require-await',
  '@typescript-eslint/restrict-plus-operands',
  '@typescript-eslint/restrict-template-expressions',
  '@typescript-eslint/no-base-to-string',
  '@typescript-eslint/non-nullable-type-assertion-style',
  '@typescript-eslint/prefer-reduce-type-parameter',
  '@typescript-eslint/dot-notation'
]

// Formatting / stylistic rules relaxed for legacy code.
const STYLE_RULES_OFF = [
  'no-use-before-define',
  'prefer-rest-params',
  'prefer-spread',
  'no-var',
  'no-unused-expressions',
  'no-trailing-spaces',
  'spaced-comment',
  'indent',
  'no-multiple-empty-lines',
  'eol-last'
]

// Non-type-aware TS rules relaxed during the migration.
const TS_RULES_OFF = [
  '@typescript-eslint/no-explicit-any',
  '@typescript-eslint/no-empty-function',
  '@typescript-eslint/explicit-function-return-type',
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/no-use-before-define',
  '@typescript-eslint/member-delimiter-style',
  '@typescript-eslint/camelcase',
  '@typescript-eslint/ban-ts-ignore',
  '@typescript-eslint/no-non-null-assertion',
  '@typescript-eslint/no-inferrable-types',
  '@typescript-eslint/no-var-requires',
  '@typescript-eslint/no-this-alias',
  '@typescript-eslint/ban-types',
  // TODO: migrate all `@ts-ignore` to `@ts-expect-error` and re-enable at 'warn'.
  // Disabled because @typescript-eslint/eslint-plugin@2.x doesn't distinguish
  // the two directives and CI runs with --max-warnings=0.
  '@typescript-eslint/ban-ts-comment'
]

// Jest rules relaxed for legacy tests (scoped to the test-files override).
const JEST_RULES_OFF = [
  'jest/expect-expect',
  'jest/no-done-callback',
  'jest/no-conditional-expect',
  'jest/no-standalone-expect',
  'jest/no-disabled-tests'
]

module.exports = {
  ignorePatterns: [
    '**/*.d.ts',
    'packages/react-native/**',
    'packages/react-native-cli/**',
    'test/**',
    'packages/core/lib/test/feature-flag-delegate.test.ts',
    'packages/electron-test-helpers/**',
    'packages/plugin-electron-power-monitor-breadcrumbs/test/**',
    'packages/web-worker/types/**'
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },

  env: {
    es2020: true,
    node: true,
    browser: true
  },

  globals: {
    globalThis: 'readonly'
  },

  plugins: ['@typescript-eslint', 'react'],

  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended'
  ],

  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',

    ...off(...STYLE_RULES_OFF),
    ...off(...TS_RULES_OFF),
    ...off(...TYPE_AWARE_DISABLED)
  },

  overrides: [
    // Type-aware rules: only for TS/TSX where parserServices are available
    // (tsconfig.eslint.json includes both source and test TS files).
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname
      },
      rules: warn(...TYPE_AWARE_SAFETY_RULES)
    },

    // Test files: enable Jest plugin/globals here so they don't lint production code.
    // Also silence type-aware safety rules that are noisy in tests where `any`
    // and fire-and-forget promises are idiomatic.
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/test/**'],
      plugins: ['jest'],
      env: {
        jest: true,
        browser: true
      },
      rules: {
        ...off(...TYPE_AWARE_SAFETY_RULES),
        ...off(...JEST_RULES_OFF)
      }
    }
  ]
}
