const ruleOverrides = {
  'jest/no-test-callback': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/camelcase': 'off',
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
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
      ],
      rules: {
        ...ruleOverrides
      }
    },
    // Linting for tests
    {
      files: [
        'packages/core/**/*.test.[tj]s?(x)'
      ],
      env: {
        jest: true,
        browser: true,
      },
      plugins: ['eslint-plugin-jest'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended'
      ],
      rules: {
        ...ruleOverrides
      }
    }
  ]
}
