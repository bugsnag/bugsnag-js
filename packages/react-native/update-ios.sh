#!/usr/bin/env bash

# ----------
# Setup Code
# ----------

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SCRIPT_NAME="${0##*/}"
TEMP_DIR=

cleanup() {
	if [ "$TEMP_DIR" != "" ]; then
		rm -rf "$TEMP_DIR"
	fi
}
trap cleanup EXIT

print_help() {
    echo "Usage: $SCRIPT_NAME [options]"
    echo
    echo "Options:"
    echo "    --version <version> (example: $SCRIPT_NAME --version 6.7.0)"
    echo "    --local <path>      (example: $SCRIPT_NAME --local ../../../bugsnag-cocoa)"
    echo "    --sha <version>     (example: $SCRIPT_NAME --sha c8210a3)"
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

MODE=unset
GIT_TAG=
BUGSNAG_COCOA_REPO_DIR=

# BSD-friendly getopt-style supporting longopt
while [ $# -gt 0 ]; do
    case $1 in
        --) shift; break;;
        -*) case $1 in
            --version)
				if [ $# -lt 2 ]; then error_missing_field $1; fi
				MODE=version
				GIT_TAG=v$2
				shift;;
            --local)
				if [ $# -lt 2 ]; then error_missing_field $1; fi
				MODE=local
				BUGSNAG_COCOA_REPO_DIR="$2"
				shift;;
            --sha)
				if [ $# -lt 2 ]; then error_missing_field $1; fi
				MODE=sha;
				GIT_TAG=$2;
				shift;;
            -*)
				error_bad_opt $1;;
            esac;;
        *)  error_bad_opt $1;;
    esac
    shift
done

# -----------
# Script Code
# -----------

revendor_from_dir() {
	local dst_dir="$SCRIPT_DIR/ios/vendor/bugsnag-cocoa"
	local src_dir="$1"
	if [ ! -d "$src_dir" ]; then
		echo "Source directory not found: $src_dir"
		exit 1
	fi
	if [ ! -d "$src_dir/Bugsnag.xcodeproj" ]; then
		echo "Source directory doesn't look like the bugsnag-cocoa repo: $src_dir"
		exit 1
	fi

	src_dir="$(cd "$src_dir" && pwd)"

	echo "Rebuilding vendor dir ${dst_dir}"
	rm -rf "$dst_dir"
	mkdir "$dst_dir"

	echo "Copying vendor code from $src_dir"
	rsync --delete -al "$src_dir/CHANGELOG.md" "$dst_dir/CHANGELOG.md"
	rsync --delete -al "$src_dir/UPGRADING.md" "$dst_dir/UPGRADING.md"
	rsync --delete -al "$src_dir/VERSION" "$dst_dir/VERSION"
	rsync --delete -al "$src_dir/README.md" "$dst_dir/README.md"
	rsync --delete -al "$src_dir/ORGANIZATION.md" "$dst_dir/ORGANIZATION.md"
	rsync --delete -al "$src_dir/Bugsnag/" "$dst_dir/Bugsnag/"
	rsync --delete -al "$src_dir/Framework/" "$dst_dir/Framework/"
	rsync --delete -al "$src_dir/Bugsnag.xcodeproj/" "$dst_dir/Bugsnag.xcodeproj/"
	rsync --delete -al "$src_dir/Bugsnag.podspec.json" "$dst_dir/Bugsnag.podspec.json"

	echo "Recording version"
	rm -rf "$SCRIPT_DIR/ios/.bugsnag-cocoa-version"
	echo $(cd "$src_dir" && git rev-parse HEAD) >> "$SCRIPT_DIR/ios/.bugsnag-cocoa-version"
}

revendor_from_clean_repo() {
	local tag=$1
	echo "Checking out https://github.com/bugsnag/bugsnag-cocoa.git with tag $tag"
	TEMP_DIR="$(mktemp -d)"
	pushd "$TEMP_DIR" >/dev/null
	git clone https://github.com/bugsnag/bugsnag-cocoa.git
	cd bugsnag-cocoa
	git checkout $tag || exit 1
	popd >/dev/null
	revendor_from_dir "$TEMP_DIR/bugsnag-cocoa"
}

case $MODE in
	unset)
		print_help
		exit 1
		;;
	version)
		revendor_from_clean_repo $GIT_TAG
		;;
	sha)
		revendor_from_clean_repo $GIT_TAG
		;;
	local)
		revendor_from_dir "$BUGSNAG_COCOA_REPO_DIR"
		;;
	*)
		echo "BUG: Invalid MODE: $MODE"
		exit 1
		;;
esac

echo "Update complete!"
