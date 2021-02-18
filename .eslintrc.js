const ruleOverrides = {
  // Disable preferring Promise-based async tests
  'jest/no-test-callback': 'off',

  // Let TypeScript inference work without being verbose
  '@typescript-eslint/explicit-function-return-type': 'off',

  // (Explicit) any has its valid use cases
  '@typescript-eslint/no-explicit-any': 'off',

  // We use noop functions liberally (() => {})
  '@typescript-eslint/no-empty-function': 'off',

  // This incorrectly fails on TypeScript method override signatures
  'no-dupe-class-members': 'off'
}

module.exports = {
  plugins: [
  ],
  rules: {
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    jsx: true,
    ecmaVersion: 2018
  },
  overrides: [
    // linting for js files
    {
      files: ['**/*.js'],
      extends: [
        'standard'
      ]
    },
    // linting for ts files
    {
      files: ['**/*.ts'],
      extends: 'standard-with-typescript',
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        ...ruleOverrides
      }
    },
    // Linting for tests
    {
      files: [
        '**/*.test.ts?(x)'
      ],
      env: {
        jest: true,
        browser: true
      },
      plugins: ['eslint-plugin-jest'],
      extends: [
        'standard-with-typescript',
        'plugin:jest/recommended'
      ],
      rules: {
        ...ruleOverrides
      }
    }
  ]
}
