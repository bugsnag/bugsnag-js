#!/usr/bin/env node

const common = require('../../../scripts/common.js')
const helper = require('../../../scripts/react-native-helper.js')
const { resolve } = require('path')

// Check for required environment variables
const requiredVars = ['REACT_NATIVE_VERSION', 'REGISTRY_URL']
let allPresent = true
requiredVars.forEach((envvar) => {
  if (!process.env[envvar]) {
    console.error(`Environment ${envvar} must be set`)
    allPresent = false
  }
})
if (!allPresent) return

common.run('rm -rf test/react-native/features/fixtures/local-build')
common.run('mkdir -p test/react-native/features/fixtures/local-build')
common.run('mkdir -p build')
helper.buildAndroid(resolve('test/react-native/features/fixtures'),
  resolve('test/react-native/features/fixtures/local-build'))
