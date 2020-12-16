#!/usr/bin/env sh

# This 'fgrep' command has major issues when running through MazeRunner because
# of the escaped quotes. Cucumber rejects the input that would make a valid
# fgrep command and adding or removing escaping makes the fgrep invalid

set -ex

fgrep 'EXTRA_PACKAGER_ARGS=\"--sourcemap-output $CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle.map\"' ios/rn0_60.xcodeproj/project.pbxproj

if [ ! -z "$1" ]; then
    fgrep "export ENDPOINT='$1'" ios/rn0_60.xcodeproj/project.pbxproj
fi
