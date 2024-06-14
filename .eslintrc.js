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
  'no-dupe-class-members': 'off',

  // Disable all rules that require parserServices (for now)
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
  '@typescript-eslint/prefer-readonly': 'off',
  '@typescript-eslint/promise-function-async': 'off',
  '@typescript-eslint/require-array-sort-compare': 'off',
  '@typescript-eslint/require-await': 'off',
  '@typescript-eslint/restrict-plus-operands': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/no-throw-literal': 'off',
  '@typescript-eslint/no-implied-eval': 'off',
  '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
  '@typescript-eslint/prefer-includes': 'off',
  '@typescript-eslint/no-for-in-array': 'off',
}

module.exports = {
  plugins: [
    'react'
  ],
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    jsx: true,
    ecmaVersion: 2018,
    sourceType: "module"
  },
  overrides: [
    // linting for js files
    {
      files: ['**/*.js'],
      extends: [
        'standard'
      ]
    },
    {
      files: ['**/*.test.js'],
      extends: ['standard'],
      plugins: ['eslint-plugin-jest'],
      env: { jest: true }
    },
    // linting for ts files
    {
      files: ['**/*.ts'],
      extends: 'standard-with-typescript',
      // We can't use rules which requires parserServices as there is no tsconfig that represents the whole monorepo (yet).
      // 'parserOptions': {
      //     'project': './tsconfig.json'
      // },
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
        browser: true,
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
