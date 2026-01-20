const fs = require('fs')
const path = require('path')

// Read package.json and scenarios index files
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const pkg = require(packageJsonPath)

const scenarioIndexPath = path.join(__dirname, '..', 'scenarios', 'index.js')
let scenarioExports = fs.readFileSync(scenarioIndexPath, 'utf8')

// Make backups of files to modify so we can restore them later
fs.copyFileSync(packageJsonPath, `${packageJsonPath}.backup`)
fs.copyFileSync(scenarioIndexPath, `${scenarioIndexPath}.backup`)

if (process.env.REACT_NATIVE_NAVIGATION) {
  pkg.files.push('/scenarios/react-native-navigation')
  scenarioExports += "\nexport * from './react-native-navigation'"
}

if (process.env.REACT_NAVIGATION === 'true' || process.env.REACT_NAVIGATION === '1') {
  pkg.files.push('/scenarios/react-navigation')
  scenarioExports += "\nexport * from './react-navigation'"
}

if (process.env.NATIVE_INTEGRATION) {
  pkg.files.push('/scenarios/native-integration')
  scenarioExports += "\nexport * from './native-integration'"
}

// Update package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))

// Update scenarios index file
fs.writeFileSync(scenarioIndexPath, scenarioExports)
