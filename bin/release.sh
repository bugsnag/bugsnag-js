#!/usr/bin/env bash

set -euo pipefail

error_missing_field () {
  echo "Missing required env var: $1"
  exit 1
}

# Ensure all required variables are set before doing any work
if [[ -z $GITHUB_USER ]]; then error_missing_field "GITHUB_USER"; fi
if [[ -z $GITHUB_ACCESS_TOKEN ]]; then error_missing_field "GITHUB_ACCESS_TOKEN"; fi
if [[ -z $RELEASE_BRANCH ]]; then error_missing_field "RELEASE_BRANCH"; fi
if [[ -z $VERSION ]]; then error_missing_field "VERSION"; fi
if [[ -z $AWS_ACCESS_KEY_ID ]]; then error_missing_field "AWS_ACCESS_KEY_ID"; fi
if [[ -z $AWS_SECRET_ACCESS_KEY ]]; then error_missing_field "AWS_SECRET_ACCESS_KEY"; fi

git clone https://$GITHUB_USER:$GITHUB_ACCESS_TOKEN@github.com/bugsnag/bugsnag-js.git

cd /app/bugsnag-js
git checkout $RELEASE_BRANCH

# "ci" rather than "install" ensures the process doesn't make the work tree dirty by modifying lockfiles
npm ci
npm run bootstrap -- --ci

prerelease () {
  npx lerna publish $VERSION --dist-tag next
  npm run cdn-upload
}

release () {
  echo "npx lerna publish $VERSION"
  echo "npm run cdn-upload"
}

case $VERSION in
  "prerelease" | "prepatch" | "preminor" | "premajor")
    prerelease
    ;;

  *)
    release
    ;;
esac
