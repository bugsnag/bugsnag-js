#!/usr/bin/env bash
set -e

IOS_REPO_DIR=../../../bugsnag-cocoa
IOS_DST=ios/vendor/bugsnag-cocoa

echo "Copying vendor code from $IOS_REPO_DIR"
rsync --delete -al "$IOS_REPO_DIR/CHANGELOG.md" "$IOS_DST/CHANGELOG.md"
rsync --delete -al "$IOS_REPO_DIR/UPGRADING.md" "$IOS_DST/UPGRADING.md"
rsync --delete -al "$IOS_REPO_DIR/VERSION" "$IOS_DST/VERSION"
rsync --delete -al "$IOS_REPO_DIR/README.md" "$IOS_DST/README.md"
rsync --delete -al "$IOS_REPO_DIR/Configurations/" "$IOS_DST/Configurations/"
rsync --delete -al "$IOS_REPO_DIR/Source/" "$IOS_DST/Source/"
rsync --delete -al "$IOS_REPO_DIR/iOS/" "$IOS_DST/iOS/"

# Copies any headers which are in the Bugsnag.podspec.json in the 
# bugsnag-cocoa repo so that React Native users can access them.
# Note that this list needs to be synchronized with any update to
# the bugsnag-cocoa repo.
echo "Copying public headers to ios/Bugsnag"
rsync --delete -al "$IOS_REPO_DIR/Source/Bugsnag.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagApp.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagAppWithState.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagBreadcrumb.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagClient.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagConfiguration.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagDevice.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagDeviceWithState.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagEndpointConfiguration.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagError.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagErrorTypes.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagEvent.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagMetadata.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagMetadataStore.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagPlugin.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagSession.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagStackframe.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagThread.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Source/BugsnagUser.h" ios/Bugsnag/
