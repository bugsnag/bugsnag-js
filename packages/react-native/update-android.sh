#!/usr/bin/env bash

# ----------
# Setup Code
# ----------

set -euo pipefail

TEMP_DIR=
cleanup() {
    if [ "$TEMP_DIR" != "" ]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="${0##*/}"
CONFIG_FILE="$SCRIPT_DIR/prepare-android-vendor.config"

print_help() {
    echo "Usage: $SCRIPT_NAME [options]"
    echo
    echo "Options (must select one):"
    echo "    --version <version> (example: $SCRIPT_NAME --version 5.8.0)"
    echo "    --local <path>      (example: $SCRIPT_NAME --local ../../../bugsnag-android)"
    echo "    --sha <version>     (example: $SCRIPT_NAME --sha 64132f5)"
    echo "    --list-versions     (lists all versions available and exits)"
}

error_bad_opt(){
    echo "$SCRIPT_NAME: invalid option '$1'";
    echo
    print_help
    exit 1
}

error_missing_field(){
    echo "$SCRIPT_NAME: $1 missing required field";
    echo
    print_help
    exit 1
}

sed_in_place() {
    local script="$1"
    local file="$2"

    if [[ "$OSTYPE" == linux* ]]; then
        sed -i "$script" "$file"
    else
        sed -i '' "$script" "$file"
    fi
}

MODE=unset
GIT_TAG=
BUGSNAG_ANDROID_REPO_DIR=

set_bugsnag_version() {
    local version=$1
    local build_gradle_file="$SCRIPT_DIR/android/build.gradle"

    echo "Now using Bugsnag version $version"
    sed_in_place "s/api \"com.bugsnag:bugsnag-android:.*/api \"com.bugsnag:bugsnag-android:$version\"/" "$build_gradle_file"
    sed_in_place "s/api \"com.bugsnag:bugsnag-plugin-react-native:.*/api \"com.bugsnag:bugsnag-plugin-react-native:$version\"/" "$build_gradle_file"
}

set_bugsnag_version_from_src_dir() {
    local src_dir="$(cd "$1" && pwd)"
    if [ ! -f "$src_dir/gradlew" ]; then
        echo "Source directory doesn't look like the bugsnag-android repo: $src_dir"
        exit 1
    fi

    local bugsnag_android_version=$(cat $src_dir/gradle.properties | grep VERSION_NAME)
    set_bugsnag_version "${bugsnag_android_version#*=}-react-native"
}

set_bugsnag_version_from_sha() {
    local tag=$1
    echo "Checking out https://github.com/bugsnag/bugsnag-android.git with tag $tag"
    TEMP_DIR="$(mktemp -d)"
    pushd "$TEMP_DIR" >/dev/null
    git clone https://github.com/bugsnag/bugsnag-android.git
    cd bugsnag-android
    git checkout $tag
    git submodule update --init --recursive
    popd >/dev/null
    set_bugsnag_version_from_src_dir "$TEMP_DIR/bugsnag-android"
}

# BSD-friendly getopt-style supporting longopt
while [ $# -gt 0 ]; do
    case $1 in
        --) shift; break;;
        -*) case $1 in
            --list-versions)
                git ls-remote --tags https://github.com/bugsnag/bugsnag-android.git | \
                    grep -v "{}" | awk "{print \$2}" | sed 's/refs\/tags\/v//g' | sed 's/refs\/tags\///g'
                exit 0
                ;;
            --version)
                if [ $# -lt 2 ]; then error_missing_field $1; fi
                echo "version" >"$CONFIG_FILE"
                echo "$2" >>"$CONFIG_FILE"
                set_bugsnag_version "$2"
                exit 0
                ;;
            --local)
                if [ $# -lt 2 ]; then error_missing_field $1; fi
                full_local_path="$(cd "$2" && pwd)"
                echo "local" >"$CONFIG_FILE"
                echo "$full_local_path" >>"$CONFIG_FILE"
                set_bugsnag_version_from_src_dir "$full_local_path"
                exit 0
                ;;
            --sha)
                if [ $# -lt 2 ]; then error_missing_field $1; fi
                echo "sha" >"$CONFIG_FILE"
                echo "$2" >>"$CONFIG_FILE"
                set_bugsnag_version_from_sha "$2"
                exit 0
                ;;
            -*)
                error_bad_opt $1;;
            esac;;
        *)  error_bad_opt $1;;
    esac
    shift
done

print_help
exit 1
