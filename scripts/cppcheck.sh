#!/usr/bin/env bash

## fail on any error
set -e

# Generate compile_commands.json files
npx lerna run generate-compile-commands

# Hide flagged errors arising from style checks in dependencies or false positives
# * The "memleak" is a known long-lived allocation
# * Node API package declarations appear as unused functions
SUPPRESSED_ERRORS=(\
    --suppress='unmatchedSuppression' \
    --suppress='unreadVariable:*/deps/*' \
    --suppress='unusedFunction:*/deps/*' \
    --suppress='unusedStructMember:*/deps/*' \
    --suppress='unusedVariable:*/deps/*' \
    --suppress='variableScope:*/deps/*' \
    --suppress='ConfigurationNotChecked:*/deps/parson/parson.c:1425' \
    --suppress='knownConditionTrueFalse:*/deps/parson/parson.c:692' \
    --suppress='memleak:*/plugin-electron-client-state-persistence/src/deps/tinycthread/tinycthread.c:620' \
    --suppress='unusedFunction:*/plugin-electron-client-state-persistence/src/api.c:469' \
    --suppress='unusedFunction:*/plugin-electron-app/src/api.c:60')

# Shared arguments:
# --enable=all: Run all checks
# -DCLOCK_REALTIME: define CLOCK_REALTIME to be 0 for the purposes of validating usage
# --force: evaluate all combinations of preprocessor defines
CHECK_CONFIGURATION=(${SUPPRESSED_ERRORS[@]} --error-exitcode=1 --quiet --enable=all -DCLOCK_REALTIME=0 --force)

# Run for each package with C/C++ components
for project in $(ls $(pwd)/packages/*/compile_commands.json); do
  echo Checking $(dirname "$project")
  cppcheck ${CHECK_CONFIGURATION[@]} --project="$project"
done
