module.exports = api => {
  // NB: This function can be called without an api argument

  const presets = []
  const plugins = []
  const overrides = []

  if (api && api.env('test')) {
    presets.push(['@babel/preset-env', {targets: {node: 'current'}}])
    presets.push('@babel/preset-typescript')
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

  if (api && !api.env('test')) {
    api.cache(false)
  }

  return { presets, plugins, overrides }
}
