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

# in RN 0.64+ the JS bundle is in this location
BUNDLE_FILE="$CONFIGURATION_BUILD_DIR/main.jsbundle"
if [ ! -f "$BUNDLE_FILE" ]; then
  # in RN <0.64 it's in this location
  BUNDLE_FILE="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle"
fi
if [ ! -f "$BUNDLE_FILE" ]; then
  echo "Skipping source map upload because app bundle could not be found."
  exit 0
fi

if [ -z "$SOURCE_MAP" ]; then
  echo "Warning: SOURCE_MAP was not specified, falling back to $BUNDLE_FILE.map"
  SOURCE_MAP="$BUNDLE_FILE.map"
fi
if [ ! -f "$SOURCE_MAP" ]; then
  echo "Error: SOURCE_MAP $SOURCE_MAP could not be found."
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
    "--source-map" "$SOURCE_MAP"
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
