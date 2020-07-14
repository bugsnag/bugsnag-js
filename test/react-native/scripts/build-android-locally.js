#!/usr/bin/env node

const common = require('../../../scripts/common.js')
const helper = require('../../../scripts/react-native-helper.js')

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

common.run('rm -rf docker-temp')
common.run('mkdir -p docker-temp/fixtures')
helper.gather('test/react-native/features/fixtures', 'docker-temp/fixtures')
common.run('docker-compose build react-native-android-builder', true)
common.run('docker-compose run react-native-android-builder', true)
common.run('docker-compose build --pull react-native-maze-runner', true)
