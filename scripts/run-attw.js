#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Run ATTW checks on all packages and output a properly formatted JSON file
 */

function getPackages() {
  try {
    const output = execSync('npx lerna list --all --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(output);
  } catch (error) {
    console.error('Failed to get package list from lerna:', error.message);
    process.exit(1);
  }
}

function runAttwForPackage(packagePath) {
  try {
    const output = execSync('npx attw --pack . -f json', {
      cwd: packagePath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Parse the JSON output (handle pretty-printed multi-line JSON)
    return JSON.parse(output);
  } catch (error) {
    // attw may exit with non-zero code if problems are found
    // but the output should still be valid JSON
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        console.error(`Failed to parse ATTW output for ${packagePath}:`, error.message);
        return null;
      }
    }
    console.error(`Failed to run ATTW for ${packagePath}:`, error.message);
    return null;
  }
}

function main() {
  console.log('Getting package list...');
  const packages = getPackages();
  console.log(`Found ${packages.length} packages`);
  
  const results = [];
  let checked = 0;
  let skipped = 0;
  
  for (const pkg of packages) {
    // Skip private packages
    if (pkg.private) {
      console.log(`Skipping private package: ${pkg.name}`);
      skipped++;
      continue;
    }
    
    console.log(`Checking ${pkg.name}...`);
    const result = runAttwForPackage(pkg.location);
    
    if (result) {
      results.push(result);
      checked++;
    } else {
      skipped++;
    }
  }
  
  // Write the results as a proper JSON array
  const outputPath = path.join(process.cwd(), 'attw-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  
  console.log(`\n✅ ATTW check complete!`);
  console.log(`   Packages checked: ${checked}`);
  console.log(`   Packages skipped: ${skipped}`);
  console.log(`   Results written to: ${outputPath}`);
  
  // Exit with error code if any package has problems
  const packagesWithProblems = results.filter(r => 
    r.problems && Object.keys(r.problems).length > 0
  ).length;
  
  if (packagesWithProblems > 0) {
    console.log(`\n⚠️  ${packagesWithProblems} package(s) have type issues`);
    process.exit(1);
  }
}

main();
