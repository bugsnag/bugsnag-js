#!/bin/bash

set -euo pipefail

# Configuration
SCHEME="reactnative"
WORKSPACE="ios/${SCHEME}.xcworkspace"
CONFIGURATION="Release"
ARCHIVE_PATH="reactnative.xcarchive"
EXPORT_PATH="output"
EXPORT_OPTIONS_PLIST="exportOptions.plist"
IPA_NAME="output.ipa"

echo "🧹 Cleaning previous archive..."
rm -rf "${ARCHIVE_PATH}"
rm -rf "${EXPORT_PATH}"

echo "📦 Installing iOS dependencies..."
pushd ios > /dev/null
bundle install
pod install --repo-update
popd > /dev/null

echo "📦 Archiving the project..."
xcrun xcodebuild \
  -scheme "${SCHEME}" \
  -workspace "${WORKSPACE}" \
  -configuration "${CONFIGURATION}" \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  -quiet \
  archive

echo "📦 Exporting IPA..."
xcrun xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -quiet

echo "📁 Renaming IPA..."
mv "${EXPORT_PATH}/${SCHEME}.ipa" "${EXPORT_PATH}/${IPA_NAME}"

echo "🧼 Cleaning up..."
rm -rf "${ARCHIVE_PATH}"

echo "✅ Build complete: ${EXPORT_PATH}/${IPA_NAME}"
