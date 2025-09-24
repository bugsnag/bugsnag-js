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
          // Disable bugfixes to ensure maximum compatibility
          bugfixes: false,
          // Use loose mode for smaller bundle size
          loose: true,
          // Don't include polyfills, only transform syntax
          useBuiltIns: false,
          // Exclude modules transformation since rollup handles it
          modules: false,
          // Force all transforms to ensure ES5 compatibility
          forceAllTransforms: true
        }]
      ],
      plugins: [
        // Add specific plugins for Object.assign polyfill if needed
        ['@babel/plugin-transform-object-assign'],
        // Explicitly transform const/let to var
        ['@babel/plugin-transform-block-scoping'],
        // Transform arrow functions
        ['@babel/plugin-transform-arrow-functions'],
        // Transform classes
        ['@babel/plugin-transform-classes'],
        // Transform spread
        ['@babel/plugin-transform-spread'],
        // Transform template literals
        ['@babel/plugin-transform-template-literals'],
        // Transform destructuring
        ['@babel/plugin-transform-destructuring']
      ]
    }
  }
  
  // For tests and other environments, use the root config
  return rootBabelConfig(api)
}
