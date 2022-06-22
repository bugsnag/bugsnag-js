#!/usr/bin/env bash

# ----------
# Setup Code
# ----------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
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
    echo "    --sha <version>     (example: $SCRIPT_NAME --sha c8210a3)"
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

MODE=unset
GIT_TAG=
BUGSNAG_COCOA_REPO_DIR=

# BSD-friendly getopt-style supporting longopt
while [ $# -gt 0 ]; do
    case $1 in
        --) shift; break;;
        -*) case $1 in
            --list-versions)
                MODE=list-versions
                ;;
            --version)
				if [ $# -lt 2 ]; then error_missing_field $1; fi
				MODE=version
				GIT_TAG=v$2
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

revendor_from_git() {
	local tag=$1
	echo "Checking out https://github.com/bugsnag/bugsnag-cocoa.git with tag $tag"
	pushd "$SCRIPT_DIR/ios/vendor/bugsnag-cocoa" >/dev/null
	git fetch
	git checkout --quiet $tag
	popd >/dev/null
}


case $MODE in
	unset)
		print_help
		exit 1
		;;
    list-versions)
        git ls-remote --tags https://github.com/bugsnag/bugsnag-cocoa.git | \
            grep -v "{}" | awk "{print \$2}" | sed 's/refs\/tags\/v//g' | sed 's/refs\/tags\///g'
        exit 0
        ;;
	version)
		revendor_from_git $GIT_TAG
		;;
	sha)
		revendor_from_git $GIT_TAG
		;;
	*)
		echo "BUG: Invalid MODE: $MODE"
		exit 1
		;;
esac

echo "Update complete!"
