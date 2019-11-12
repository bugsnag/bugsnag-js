// eslint config for .js files
module.exports = {
  extends: [
    'standard'
  ],
  plugins: [
    'react'
  ],
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error'
  },
  parserOptions: {
    jsx: true
  }
}
