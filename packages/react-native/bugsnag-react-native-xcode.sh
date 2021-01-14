#/bin/bash

set -o errexit

INFO_PLIST=$BUILT_PRODUCTS_DIR/$INFOPLIST_PATH
APP_VERSION=$(/usr/libexec/PlistBuddy -c "print :CFBundleShortVersionString" "$INFO_PLIST")
BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c "print :CFBundleVersion" "$INFO_PLIST")

API_KEY="$BUGSNAG_API_KEY"
if [ -z "$API_KEY" ]; then
  API_KEY=$(/usr/libexec/PlistBuddy -c "print :bugsnag:apiKey" "$INFO_PLIST" || echo)
fi
if [ -z "$API_KEY" ]; then
  echo "No Bugsnag API key detected - add your key to your Info.plist or BUGSNAG_API_KEY environment variable"
  exit 1
fi

DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"

BUNDLE_FILE="$DEST/main.jsbundle"
if [ ! -f "$BUNDLE_FILE" ]; then
  echo "Skipping source map upload because app has not been bundled."
  exit 0
fi

MAP_FILE="$BUNDLE_FILE.map"
if [ ! -f "$MAP_FILE" ]; then
  echo "Error: Source map main.jsbundle.map could not be found."
  echo "Ensure the --sourcemap-output option is passed to the react-native bundle command."
  exit 1
fi

# This script gets executed in the <project_root>/ios directory
PROJECT_ROOT=${PWD%\/ios}

ARGS=(
    "--api-key" "$API_KEY"
    "--app-bundle-version" "$BUNDLE_VERSION"
    "--app-version" "$APP_VERSION"
    "--bundle" "$BUNDLE_FILE"
    "--platform" "ios"
    "--source-map" "$MAP_FILE"
    "--project-root" "$PROJECT_ROOT"
    )

case "$CONFIGURATION" in
  *Debug*)
    ARGS+=("--dev")
    ;;
esac

if [ ! -z "$ENDPOINT" ]; then
  ARGS+=("--endpoint")
  ARGS+=("$ENDPOINT")
fi

../node_modules/.bin/bugsnag-source-maps upload-react-native "${ARGS[@]}"
