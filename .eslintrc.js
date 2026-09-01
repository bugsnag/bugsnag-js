const off = (...rules) => Object.fromEntries(rules.map(r => [r, 'off']))
const warn = (...rules) => Object.fromEntries(rules.map(r => [r, 'warn']))

const TYPE_AWARE_SAFETY_RULES = [
  '@typescript-eslint/no-floating-promises',
  '@typescript-eslint/no-misused-promises',
  '@typescript-eslint/no-unsafe-assignment',
  '@typescript-eslint/no-unsafe-call',
  '@typescript-eslint/no-unsafe-return',
  '@typescript-eslint/no-unsafe-member-access'
]

const TYPE_AWARE_DISABLED = [
  '@typescript-eslint/require-await',
  '@typescript-eslint/restrict-plus-operands',
  '@typescript-eslint/restrict-template-expressions',
  '@typescript-eslint/no-base-to-string',
  '@typescript-eslint/non-nullable-type-assertion-style',
  '@typescript-eslint/prefer-reduce-type-parameter',
  '@typescript-eslint/dot-notation'
]

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
  'eol-last',
  'no-useless-constructor',
  'standard/no-callback-literal',
  'import/no-duplicates',
  'no-template-curly-in-string'
]

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
  '@typescript-eslint/ban-ts-comment',
  '@typescript-eslint/no-useless-constructor'
]

const JEST_RULES_OFF = [
  'jest/expect-expect',
  'jest/no-done-callback',
  'jest/no-conditional-expect',
  'jest/no-standalone-expect',
  'jest/no-disabled-tests',
  'jest/no-commented-out-tests'
]

module.exports = {
  // prevent --report-unused-disable-directives (used in CI) from failing on legacy disables
  reportUnusedDisableDirectives: false,

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
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname
      },
      rules: warn(...TYPE_AWARE_SAFETY_RULES)
    },

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
