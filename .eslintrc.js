// eslint config for .js files
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
        '@typescript-eslint/no-explicit-any': 'off'
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
      extends: ['plugin:jest/recommended'],
    }
  ]
}
