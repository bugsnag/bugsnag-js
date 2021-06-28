#!/usr/bin/env bash

set -euo pipefail

error_missing_field () {
  echo "Missing required env var: $1"
  exit 1
}

# Ensure all required variables are set before doing any work
if [[ -z ${GITHUB_USER:-} ]]; then error_missing_field "GITHUB_USER"; fi
if [[ -z ${GITHUB_ACCESS_TOKEN:-} ]]; then error_missing_field "GITHUB_ACCESS_TOKEN"; fi
if [[ -z ${RELEASE_BRANCH:-} ]]; then error_missing_field "RELEASE_BRANCH"; fi
if [[ -z ${VERSION:-} ]]; then error_missing_field "VERSION"; fi
if [[ -z ${AWS_ACCESS_KEY_ID:-} ]]; then error_missing_field "AWS_ACCESS_KEY_ID"; fi
if [[ -z ${AWS_SECRET_ACCESS_KEY:-} ]]; then error_missing_field "AWS_SECRET_ACCESS_KEY"; fi

git clone --single-branch \
  --branch "$RELEASE_BRANCH" \
  https://"$GITHUB_USER":"$GITHUB_ACCESS_TOKEN"@github.com/bugsnag/bugsnag-js.git

cd /app/bugsnag-js

# "ci" rather than "install" ensures the process doesn't make the work tree dirty by modifying lockfiles
npm ci
npm run bootstrap -- --ci

# check if the browser package changed – if it didn't we don't need to upload to the CDN
BROWSER_PACKAGE_CHANGED=`npx lerna changed --parseable | grep -c packages/js$`

prerelease () {
  npx lerna publish "$VERSION" --dist-tag next
  if [ $BROWSER_PACKAGE_CHANGED -eq 1 ]; then
    npm run cdn-upload
  fi
}

release () {
  echo "npx lerna publish $VERSION"
  if [ $BROWSER_PACKAGE_CHANGED -eq 1 ]; then
    echo "npm run cdn-upload"
  fi
}

case $VERSION in
  "prerelease" | "prepatch" | "preminor" | "premajor")
    prerelease
    ;;

  *)
    release
    ;;
esac
