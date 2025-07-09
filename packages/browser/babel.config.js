const rootBabelConfig = require('../../babel.config.js')

module.exports = api => {
  // For production builds (browser), use modern preset targeting old browsers
  if (api && !api.env('test')) {
    return {
      presets: [
        ['@babel/preset-env', {
          // Target Chrome 43 and IE 11 for maximum compatibility
          targets: {
            chrome: '43',
            ie: '11'
          },
          // Only include transforms that are needed
          bugfixes: true,
          // Use loose mode for smaller bundle size
          loose: true,
          // Don't include polyfills, only transform syntax
          useBuiltIns: false,
          // Exclude modules transformation since rollup handles it
          modules: false
        }]
      ],
      plugins: [
        // Add specific plugins for Object.assign polyfill if needed
        ['@babel/plugin-transform-object-assign']
      ]
    }
  }
  
  // For tests and other environments, use the root config
  return rootBabelConfig(api)
}
