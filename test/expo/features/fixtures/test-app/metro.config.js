const { resolve, join } = require('path')
const { readdirSync } = require('fs')

const pkgs = resolve(__dirname, '../../../../../packages')
const mods = resolve(__dirname, '../../../../../node_modules')

const watchFolders = [ __dirname, join(__dirname, 'node_modules') ]
  .concat(
    readdirSync(pkgs)
      .map(pkg => join(pkgs, pkg))
  )
  .concat(
    readdirSync(mods)
      .map(pkg => join(mods, pkg))
  )

module.exports = {
  watchFolders,
  resolver: {
    extraNodeModules: {
      'expo': resolve(__dirname, 'node_modules/expo'),
      'react-native': resolve(__dirname, 'node_modules/react-native'),
      'react': resolve(__dirname, 'node_modules/react'),
      '@babel/runtime': resolve(__dirname, 'node_modules/@babel/runtime'),
      'promise': resolve(__dirname, 'node_modules/promise'),
      '@unimodules/core': resolve(__dirname, 'node_modules/@unimodules/core')
    }
  }
}