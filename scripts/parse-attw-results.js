#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Parse ATTW results and generate a report
 * Usage: node scripts/parse-attw-results.js [--format=markdown|json|text]
 */

function parseResults(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];
  
  let currentJson = '';
  let braceCount = 0;
  let inJson = false;
  
  for (const line of lines) {
    // Skip empty lines and lines that don't start a JSON object if we're not already in one
    if (!inJson && !line.trim().startsWith('{')) {
      continue;
    }
    
    // Start tracking a new JSON object
    if (line.trim().startsWith('{') && braceCount === 0) {
      inJson = true;
      currentJson = '';
      braceCount = 0;
    }
    
    if (inJson) {
      currentJson += line + '\n';
      
      // Count braces to know when we've completed a JSON object
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // When braceCount returns to 0, we have a complete JSON object
      if (braceCount === 0) {
        try {
          const parsed = JSON.parse(currentJson);
          results.push(parsed);
        } catch (err) {
          console.error('Error parsing JSON object:', err.message);
        }
        inJson = false;
        currentJson = '';
      }
    }
  }
  
  return results;
}

function analyzeResults(results) {
  const packagesWithProblems = results.filter(result => {
    return result.problems && Object.keys(result.problems).length > 0;
  });

  const analysis = {
    totalPackages: results.length,
    packagesWithProblems: packagesWithProblems.length,
    packagesWithoutProblems: results.length - packagesWithProblems.length,
    details: []
  };

  for (const result of packagesWithProblems) {
    const packageName = result.analysis.packageName;
    const problemCount = Object.keys(result.problems).length;
    
    // Group problems by kind
    const problemsByKind = {};
    for (const [entrypoint, issues] of Object.entries(result.problems)) {
      for (const issue of issues) {
        const kind = issue.kind;
        if (!problemsByKind[kind]) {
          problemsByKind[kind] = [];
        }
        // Extract useful info from the issue
        const issueInfo = {
          entrypoint,
          fileName: issue.fileName,
          moduleSpecifier: issue.moduleSpecifier,
          resolutionOption: issue.resolutionOption,
          // Get the last line of trace which often has the key error message
          traceMessage: issue.trace && issue.trace.length > 0 
            ? issue.trace[issue.trace.length - 1] 
            : null
        };
        problemsByKind[kind].push(issueInfo);
      }
    }

    analysis.details.push({
      packageName,
      problemCount,
      problemsByKind
    });
  }

  return analysis;
}

function formatAsText(analysis) {
  let output = '\n=== Are The Types Wrong? Report ===\n\n';
  
  output += `Total packages checked: ${analysis.totalPackages}\n`;
  output += `Packages with problems: ${analysis.packagesWithProblems}\n`;
  output += `Packages without problems: ${analysis.packagesWithoutProblems}\n\n`;

  if (analysis.packagesWithProblems === 0) {
    output += '✅ All packages passed the type check!\n';
  } else {
    output += `❌ Found issues in ${analysis.packagesWithProblems} package(s):\n\n`;
    
    for (const pkg of analysis.details) {
      output += `📦 ${pkg.packageName}\n`;
      output += `   ${pkg.problemCount} problem(s) detected\n\n`;
      
      for (const [kind, problems] of Object.entries(pkg.problemsByKind)) {
        output += `   ${kind} (${problems.length} occurrence(s)):\n`;
        for (const issue of problems.slice(0, 3)) {
          if (issue.moduleSpecifier) {
            output += `   - ${issue.moduleSpecifier} (in ${issue.fileName?.split('/').pop() || 'unknown'})\n`;
          } else {
            output += `   - ${issue.entrypoint}\n`;
          }
          if (issue.traceMessage) {
            output += `     ${issue.traceMessage}\n`;
          }
        }
        if (problems.length > 3) {
          output += `   - ... and ${problems.length - 3} more\n`;
        }
        output += '\n';
      }
    }
  }

  return output;
}

function formatAsMarkdown(analysis) {
  let output = '## 📦 Are The Types Wrong? Report\n\n';
  
  output += `**Total packages checked:** ${analysis.totalPackages}  \n`;
  output += `**Packages with problems:** ${analysis.packagesWithProblems}  \n`;
  output += `**Packages without problems:** ${analysis.packagesWithoutProblems}\n\n`;

  if (analysis.packagesWithProblems === 0) {
    output += '✅ All packages passed the type check!\n';
  } else {
    output += `❌ Found issues in ${analysis.packagesWithProblems} package(s):\n\n`;
    
    for (const pkg of analysis.details) {
      output += `### \`${pkg.packageName}\`\n\n`;
      output += `**${pkg.problemCount} problem(s) detected:**\n\n`;
      
      for (const [kind, problems] of Object.entries(pkg.problemsByKind)) {
        output += `**${kind}** (${problems.length} occurrence(s)):\n`;
        for (const issue of problems.slice(0, 3)) {
          if (issue.moduleSpecifier) {
            output += `- \`${issue.moduleSpecifier}\` in \`${issue.fileName?.split('/').pop() || 'unknown'}\`\n`;
          } else {
            output += `- \`${issue.entrypoint}\`\n`;
          }
        }
        if (problems.length > 3) {
          output += `- ... and ${problems.length - 3} more\n`;
        }
        output += '\n';
      }
    }
  }

  output += '\n---\n';
  output += '*This check helps ensure TypeScript types are correctly exported and work across different module systems.*\n';

  return output;
}

function main() {
  const args = process.argv.slice(2);
  const formatArg = args.find(arg => arg.startsWith('--format='));
  const format = formatArg ? formatArg.split('=')[1] : 'text';
  
  const resultsPath = path.join(process.cwd(), 'attw-results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.error('❌ Error: attw-results.json not found');
    console.error('Run "npm run test:attw" first to generate the results file');
    process.exit(1);
  }

  try {
    const results = parseResults(resultsPath);
    const analysis = analyzeResults(results);

    if (format === 'json') {
      console.log(JSON.stringify(analysis, null, 2));
    } else if (format === 'markdown') {
      console.log(formatAsMarkdown(analysis));
    } else {
      console.log(formatAsText(analysis));
    }

    // Exit with error code if there are problems
    process.exit(analysis.packagesWithProblems > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error parsing results:', error.message);
    process.exit(1);
  }
}

main();
