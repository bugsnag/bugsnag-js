#!/usr/bin/env bash
set -e

IOS_REPO_DIR=../../../bugsnag-cocoa
IOS_DST=ios/vendor/bugsnag-cocoa

echo "Clearing out ${IOS_DST}"
rm -rf $IOS_DST

mkdir $IOS_DST

echo "Copying vendor code from $IOS_REPO_DIR"
rsync --delete -al "$IOS_REPO_DIR/CHANGELOG.md" "$IOS_DST/CHANGELOG.md"
rsync --delete -al "$IOS_REPO_DIR/UPGRADING.md" "$IOS_DST/UPGRADING.md"
rsync --delete -al "$IOS_REPO_DIR/VERSION" "$IOS_DST/VERSION"
rsync --delete -al "$IOS_REPO_DIR/README.md" "$IOS_DST/README.md"
rsync --delete -al "$IOS_REPO_DIR/ORGANIZATION.md" "$IOS_DST/ORGANIZATION.md"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/" "$IOS_DST/Bugsnag/"
rsync --delete -al "$IOS_REPO_DIR/Framework/" "$IOS_DST/Framework/"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag.xcodeproj/" "$IOS_DST/Bugsnag.xcodeproj/"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag.podspec.json" "$IOS_DST/Bugsnag.podspec.json"

echo "Recording version"
rm -rf ./ios/.bugsnag-cocoa-version
echo $(cd $IOS_REPO_DIR && git rev-parse HEAD) >> ./ios/.bugsnag-cocoa-version
