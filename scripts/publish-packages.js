#!/usr/bin/env node

const { execSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')

const ROOT_DIR = resolve(__dirname, '..')

function run (command, options = {}) {
  console.log(`Running: ${command}`)
  execSync(command, { stdio: 'inherit', ...options })
}

function packPackages () {
  // Get all package directories
  const packagesDir = resolve(ROOT_DIR, 'packages')
  const packages = fs.readdirSync(packagesDir)
    .filter(dir => {
      // Filter out any non-directories or hidden directories
      const stat = fs.statSync(resolve(packagesDir, dir))
      return stat.isDirectory() && !dir.startsWith('.')
    })

  // Create a dist directory if it doesn't exist
  const distDir = resolve(ROOT_DIR, 'dist')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir)
  }

  console.log('\nPacking packages...')
  for (const pkg of packages) {
    const packagePath = resolve(packagesDir, pkg)
    run(`npm pack "${packagePath}"`, { cwd: distDir })
  }
}

async function main () {
  try {
    console.log('Installing dependencies...')
    run('npm ci', { cwd: ROOT_DIR })

    console.log('\nBuilding packages...')
    run('npm run build', { cwd: ROOT_DIR })

    packPackages()

    console.log('\nDone! Packages are available in the dist directory')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
