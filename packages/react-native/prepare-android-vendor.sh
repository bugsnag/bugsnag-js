#!/usr/bin/env bash

set -xeuo pipefail

TEMP_DIR=
cleanup() {
    if [ "$TEMP_DIR" != "" ]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SCRIPT_NAME="${0##*/}"
CONFIG_FILE="$SCRIPT_DIR/prepare-android-vendor.config"

MODE=$(head -1 "$CONFIG_FILE")
ARG=$(tail -1 "$CONFIG_FILE")

MAVEN_REPO_DIR="$HOME/.m2/repository/com/bugsnag"
ARTIFACT_NAMES=(
    bugsnag-android
    bugsnag-android-core
    bugsnag-android-ndk
    bugsnag-plugin-android-ndk
    bugsnag-plugin-android-anr
    bugsnag-plugin-react-native
    )
REPO_FILE_VARIANTS=(
    '-sources.jar'
    '-sources.jar.asc'
    '.aar'
    '.aar.asc'
    '.module'
    '.module.asc'
    '.pom'
    '.pom.asc'
    )

sed_in_place() {
    local script="$1"
    local file="$2"

    if [[ "$OSTYPE" == linux* ]]; then
        sed -i "$script" "$file"
    else
        sed -i '' "$script" "$file"
    fi
}

revendor_from_dir() {
    local src_dir="$(cd "$1" && pwd)"
    if [ ! -f "$src_dir/gradlew" ]; then
        echo "Source directory doesn't look like the bugsnag-android repo: $src_dir"
        exit 1
    fi

    local dst_dir="$SCRIPT_DIR/android"
    local com_dir="$dst_dir/com"

    # artefact version needs to be unique to avoid clash with bugsnag-android artefacts
    # deployed on mavenCentral/jcenter, append a 'react-native' suffix
    local bugsnag_android_version=$(cat $src_dir/gradle.properties | grep VERSION_NAME)
    local bugsnag_version_rn="${bugsnag_android_version#*=}-react-native"

    echo "Clearing local maven repo $MAVEN_REPO_DIR"
    rm -rf "$MAVEN_REPO_DIR"

    echo "Building local copy of bugsnag-android $bugsnag_version_rn"
    "$src_dir/gradlew" -p "$src_dir" clean assembleRelease publishToMavenLocal -PVERSION_NAME=$bugsnag_version_rn

    echo "Rebuilding vendor dir $dst_dir"
    rm -rf "$com_dir"
    mkdir -p "$com_dir"
    cp -r "$MAVEN_REPO_DIR" "$com_dir/"

    echo "Recording version"
    rm -rf "$dst_dir/.bugsnag-android-version"
    echo $(cd "$src_dir" && git rev-parse HEAD) >> "$dst_dir/.bugsnag-android-version"

    sed_in_place "s/api \"com.bugsnag:bugsnag-android:.*/api \"com.bugsnag:bugsnag-android:$bugsnag_version_rn\"/" "$dst_dir/build.gradle"
    sed_in_place "s/api \"com.bugsnag:bugsnag-plugin-react-native:.*/api \"com.bugsnag:bugsnag-plugin-react-native:$bugsnag_version_rn\"/" "$dst_dir/build.gradle"
}

use_bugsnag_version() {
    local version=$1
    local dst_dir="$SCRIPT_DIR/android"
    local bugsnag_dir="$dst_dir/com/bugsnag"

    rm -rf "$bugsnag_dir"

    for name in ${ARTIFACT_NAMES[@]}; do
        local dstdir="$bugsnag_dir/$name"
        mkdir -p "$dstdir"
        pushd "$dstdir"
        for variant in ${REPO_FILE_VARIANTS[@]}; do
            curl https://repo1.maven.org/maven2/com/bugsnag/$name/$version/$name-$version$variant >>$name-$version$variant
        done
    done

    sed_in_place "s/api \"com.bugsnag:bugsnag-android:.*/api \"com.bugsnag:bugsnag-android:$version\"/" "$dst_dir/build.gradle"
    sed_in_place "s/api \"com.bugsnag:bugsnag-plugin-react-native:.*/api \"com.bugsnag:bugsnag-plugin-react-native:$version\"/" "$dst_dir/build.gradle"
}

revendor_from_sha() {
    local tag=$1
    echo "Checking out https://github.com/bugsnag/bugsnag-android.git with tag $tag"
    TEMP_DIR="$(mktemp -d)"
    pushd "$TEMP_DIR" >/dev/null
    git clone https://github.com/bugsnag/bugsnag-android.git
    cd bugsnag-android
    git checkout $tag
    git submodule update --init --recursive
    popd >/dev/null
    revendor_from_dir "$TEMP_DIR/bugsnag-android"
}

case $MODE in
	version)
        use_bugsnag_version $ARG
        ;;
	sha)
        revendor_from_sha $ARG
        ;;
	local)
        revendor_from_dir "$ARG"
        ;;
	*)
	    echo "$MODE: Unknown mode in $CONFIG_FILE"
	    exit 1
	    ;;
esac;
