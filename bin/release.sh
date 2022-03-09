#!/usr/bin/env bash

set -euxo pipefail

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

npx lerna run build \
  --scope @bugsnag/node \
  --scope @bugsnag/browser \
  --scope @bugsnag/expo
  
npx lerna run build \
  --ignore @bugsnag/node\
  --ignore @bugsnag/browser \
  --ignore @bugsnag/expo \
  --ignore @bugsnag/plugin-electron-app \
  --ignore @bugsnag/plugin-electron-client-state-persistence

# check if the browser package changed – if it didn't we don't need to upload to the CDN
BROWSER_PACKAGE_CHANGED=$(npx lerna changed --parseable | grep -c packages/js$ || test $? = 1;)

case $VERSION in
  "prerelease" | "prepatch" | "preminor" | "premajor")
    npx lerna publish "$VERSION" --dist-tag next
    ;;

  *)
    npx lerna publish "$VERSION"
    ;;
esac

if [ "$BROWSER_PACKAGE_CHANGED" -eq 1 ]; then
  npm run cdn-upload
fi
