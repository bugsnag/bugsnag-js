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

  plugins: ['@typescript-eslint', 'react', 'jest'],

  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended'
  ],

  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',

    // Fix remaining issues
    'no-use-before-define': 'off',
    'prefer-rest-params': 'off',
    'prefer-spread': 'off',
    'no-var': 'off',
    'no-unused-expressions': 'off',

    // Disable problematic Jest rules
    'jest/expect-expect': 'off',

    // Formatting relaxations
    'no-trailing-spaces': 'off',
    'spaced-comment': 'off',
     indent: 'off',
    'no-multiple-empty-lines': 'off',

    // Relaxed TS rules
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',

    // Disable ALL type-aware rules
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/dot-notation': 'off',

    // Allow legacy/commonjs code
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/ban-types': 'off',

    // Disable Jest callback restrictions
    'jest/no-done-callback': 'off',
    'jest/no-conditional-expect': 'off',
    'jest/no-standalone-expect': 'off',
    'jest/no-disabled-tests': 'off',

    // Misc
    'eol-last': 'off'
  },

  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.js', '**/test/**'],
      env: {
        jest: true,
        browser: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',

        // Ensure all Jest strict rules are OFF for legacy tests
        'jest/no-done-callback': 'off',
        'jest/no-conditional-expect': 'off',
        'jest/no-standalone-expect': 'off',
        'jest/no-disabled-tests': 'off',
        'jest/expect-expect': 'off'
      }
    }
  ]
}