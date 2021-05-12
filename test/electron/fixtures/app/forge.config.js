module.exports = {
  packagerConfig: {},
  plugins: [
    ['@electron-forge/plugin-webpack', {
      mainConfig: './webpack.main.config.js',
      renderer: {
        config: './webpack.renderer.config.js',
        entryPoints: [
          {
            html: './index.html',
            js: './renderer.js',
            name: 'main_window'
          },
          {
            html: './inline-script-exception.html',
            js: './inline-script-exception.js',
            name: 'inline_script_exception'
          }
        ]
      }
    }]
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Runner'
      }
    },
    {
      name: '@electron-forge/maker-dmg'
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    }
  ]
}
