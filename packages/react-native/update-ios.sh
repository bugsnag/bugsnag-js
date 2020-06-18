#!/usr/bin/env bash
set -e

IOS_REPO_DIR=../../../bugsnag-cocoa
IOS_DST=ios/vendor/bugsnag-cocoa
IOS_PUBLIC_HEADERS_DST=ios/Bugsnag

echo "Clearing out ${IOS_PUBLIC_HEADERS_DST} and ${IOS_DST}"
rm -fr ${IOS_PUBLIC_HEADERS_DST}
rm -rf $IOS_DST

mkdir ${IOS_PUBLIC_HEADERS_DST}
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

# Copies any headers which are in the Bugsnag.podspec.json in the
# bugsnag-cocoa repo so that React Native users can access them.
# Note that this list needs to be synchronized with any update to
# the bugsnag-cocoa repo.
echo "Copying public headers to ${IOS_PUBLIC_HEADERS_DST}"
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Bugsnag.h" ${IOS_PUBLIC_HEADERS_DST}/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Client/BugsnagClient.h" ${IOS_PUBLIC_HEADERS_DST}/Client/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Configuration/BugsnagConfiguration.h" ${IOS_PUBLIC_HEADERS_DST}/Configuration/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Configuration/BugsnagEndpointConfiguration.h" ${IOS_PUBLIC_HEADERS_DST}/Configuration/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Configuration/BugsnagErrorTypes.h" ${IOS_PUBLIC_HEADERS_DST}/Configuration/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Metadata/BugsnagMetadata.h" ${IOS_PUBLIC_HEADERS_DST}/Metadata/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Metadata/BugsnagMetadataStore.h" ${IOS_PUBLIC_HEADERS_DST}/Metadata/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagApp.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagAppWithState.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagBreadcrumb.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagDevice.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagDeviceWithState.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagError.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagEvent.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagSession.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagStackframe.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagThread.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Payload/BugsnagUser.h" ${IOS_PUBLIC_HEADERS_DST}/Payload/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/Plugins/BugsnagPlugin.h" ${IOS_PUBLIC_HEADERS_DST}/Plugins/
rsync --delete -al "$IOS_REPO_DIR/Bugsnag/BSG_KSCrashReportWriter.h" ${IOS_PUBLIC_HEADERS_DST}/
