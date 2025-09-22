#!/bin/bash

# GitHub Actions Workflow Linter Script
# This script lints all workflow files using actionlint

set -euo pipefail

echo "🔍 Linting GitHub Actions workflows..."

# Check if actionlint is installed
if ! command -v actionlint &> /dev/null; then
    echo "❌ actionlint is not installed"
    echo "📦 Install with: brew install actionlint"
    exit 1
fi

# Lint all workflow files
WORKFLOW_FILES=$(find .github/workflows -type f \( -name "*.yml" -o -name "*.yaml" \))
if [ -z "$WORKFLOW_FILES" ]; then
    echo "ℹ️  No workflow files found to lint."
    exit 0
fi
if actionlint $WORKFLOW_FILES; then
    echo "✅ All workflows are valid!"
else
    echo "❌ Workflow linting failed"
    exit 1
fi