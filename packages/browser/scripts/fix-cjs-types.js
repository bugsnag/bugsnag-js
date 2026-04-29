#!/usr/bin/env node

/**
 * Post-build script to create proper type declaration files
 * - CJS types with 'export =' syntax
 * - ESM types with .d.mts extension for proper module detection
 */

const fs = require('fs');
const path = require('path');

// Fix CommonJS types: change 'export default' to 'export ='
const cjsSourceFile = path.join(__dirname, '../dist/types/index-cjs.d.ts');
const cjsTargetFile = path.join(__dirname, '../dist/types/index-cjs.d.cts');

let cjsContent = fs.readFileSync(cjsSourceFile, 'utf8');
cjsContent = cjsContent.replace(
  /export default (_default);/,
  'export = $1;'
);
fs.writeFileSync(cjsTargetFile, cjsContent);
console.log('Created CommonJS type declaration: dist/types/index-cjs.d.cts');

// Fix ESM types: copy to .d.mts extension and add .js extensions to relative imports
const esmSourceFile = path.join(__dirname, '../dist/types/index-es.d.ts');
const esmTargetFile = path.join(__dirname, '../dist/types/index-es.d.mts');

let esmContent = fs.readFileSync(esmSourceFile, 'utf8');
// Add .js extensions to relative imports for Node16 ESM resolution
esmContent = esmContent.replace(/from '(\.\/.+?)';/g, "from '$1.js';");
fs.writeFileSync(esmTargetFile, esmContent);
console.log('Created ESM type declaration: dist/types/index-es.d.mts');
