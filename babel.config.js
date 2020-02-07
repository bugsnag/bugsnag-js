module.exports = api => {
  // NB: This function can be called without an api argument, e.g. by bin/bundle

  const presets = []
  const plugins = [
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
  ]
  const overrides = []

  if (api && !api.env('test')) {
    api.cache(false)
  }

  if (api && api.env('test')) {
    presets.push(
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current'
          }
        }
      ],
      '@babel/preset-typescript'
    )
    plugins.unshift(
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    )
    overrides.push({
      test: './node_modules/react-native/**/*',
      presets: ['module:metro-react-native-babel-preset']
    })
  }

  return { presets, plugins, overrides }
}
