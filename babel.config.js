module.exports = api => {
  // NB: This function can be called without an api argument, e.g. by bin/bundle

  const presets = []
  const plugins = []
  const overrides = []

  if (api && api.env('test')) {
    presets.push('@babel/preset-typescript')
    plugins.push(['@babel/plugin-proposal-class-properties', { loose: true }])
    plugins.push('@babel/plugin-transform-modules-commonjs')
    plugins.push('@babel/plugin-proposal-optional-chaining')
    overrides.push({
      test: 'node_modules/react-native/**/*',
      presets: ['module:metro-react-native-babel-preset']
    })
    overrides.push({
      test: './packages/plugin-react/**/*',
      presets: ['@babel/preset-react']
    })
    overrides.push({
      test: './packages/plugin-react-navigation/**/*',
      presets: ['@babel/preset-react', 'module:metro-react-native-babel-preset']
    })
  }

  plugins.push(
    ['@babel/plugin-transform-arrow-functions'],
    ['@babel/plugin-transform-block-scoping'],
    ['@babel/plugin-transform-classes', { loose: true }],
    ['@babel/plugin-transform-computed-properties', { loose: true }],
    ['@babel/plugin-transform-destructuring', { loose: true }],
    ['@babel/plugin-transform-member-expression-literals'],
    ['@babel/plugin-transform-property-literals'],
    ['@babel/plugin-transform-parameters', { loose: true }],
    ['@babel/plugin-transform-shorthand-properties'],
    ['@babel/plugin-transform-spread', { loose: true }],
    ['@babel/plugin-transform-template-literals', { loose: true }],
    ['@babel/plugin-proposal-object-rest-spread', { loose: true }],
    ['@babel/syntax-object-rest-spread']
  )

  if (api && !api.env('test')) {
    api.cache(false)
  }

  return { presets, plugins, overrides }
}
