#!/usr/bin/env bash

set -eu

git clone https://$GITHUB_USER:$GITHUB_ACCESS_TOKEN@github.com/bugsnag/bugsnag-js.git

cd /app/bugsnag-js
git checkout $RELEASE_BRANCH

# "ci" rather than "install" ensures the process doesn't make the work tree dirty by modifying lockfiles
npm ci
npm run bootstrap -- --ci

npx lerna publish prerelease --dist-tag next