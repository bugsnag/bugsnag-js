#!/usr/bin/env bash
set -e

IOS_REPO_DIR=../../../bugsnag-cocoa
IOS_DST=ios/vendor/bugsnag-cocoa

echo "Copying vendor code from $IOS_REPO_DIR"
rsync --delete -al "$IOS_REPO_DIR/CHANGELOG.md" "$IOS_DST/CHANGELOG.md"
rsync --delete -al "$IOS_REPO_DIR/UPGRADING.md" "$IOS_DST/UPGRADING.md"
rsync --delete -al "$IOS_REPO_DIR/VERSION" "$IOS_DST/VERSION"
rsync --delete -al "$IOS_REPO_DIR/README.md" "$IOS_DST/README.md"
rsync --delete -al "$IOS_REPO_DIR/ORGANIZATION.md" "$IOS_DST/ORGANIZATION.md"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/" "$IOS_DST/Bugsnag/"
rsync --delete -al "$IOS_REPO_DIR/Framework/" "$IOS_DST/Framework/"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag.xcodeproj/" "$IOS_DST/Bugsnag.xcodeproj/"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag.podspec.json" "$IOS_DST/.podspec.json"

# Copies any headers which are in the Bugsnag.podspec.json in the 
# bugsnag-cocoa repo so that React Native users can access them.
# Note that this list needs to be synchronized with any update to
# the bugsnag-cocoa repo.
echo "Copying public headers to ios/Bugsnag"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Bugsnag.h" ios/Bugsnag/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagApp.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagAppWithState.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagBreadcrumb.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Client/BugsnagClient.h" ios/Bugsnag/Client/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Configuration/BugsnagConfiguration.h" ios/Bugsnag/Configuration/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagDevice.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagDeviceWithState.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Configuration/BugsnagEndpointConfiguration.h" ios/Bugsnag/Configuration/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagError.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Configuration/BugsnagErrorTypes.h" ios/Bugsnag/Configuration/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagEvent.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Metadata/BugsnagMetadata.h" ios/Bugsnag/Metadata/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Metadata/BugsnagMetadataStore.h" ios/Bugsnag/Metadata/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Plugins/BugsnagPlugin.h" ios/Bugsnag/Plugins/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagSession.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagStackframe.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagThread.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagUser.h" ios/Bugsnag/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/BSG_KSCrashReportWriter.h" ios/Bugsnag/
