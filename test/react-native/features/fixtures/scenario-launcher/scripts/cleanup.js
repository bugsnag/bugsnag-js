const fs = require('fs')
const path = require('path')

const packagePath = path.join(__dirname, '..', 'package.json')
const backupPath = `${packagePath}.backup`

// Restore original package.json if backup exists
if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, packagePath)
  fs.unlinkSync(backupPath)
}

// Restore original scenarios index file if backup exists
const scenarioIndexPath = path.join(__dirname, '..', 'scenarios', 'index.js')
const scenarioBackupPath = `${scenarioIndexPath}.backup`
if (fs.existsSync(scenarioBackupPath)) {
  fs.copyFileSync(scenarioBackupPath, scenarioIndexPath)
  fs.unlinkSync(scenarioBackupPath)
}
