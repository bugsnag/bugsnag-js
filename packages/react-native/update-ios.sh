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
VERSION=

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
				VERSION=$2
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

case $MODE in
	unset)
		print_help
		exit 1
		;;
    list-versions)
        git ls-remote --tags https://github.com/bugsnag/bugsnag-cocoa.git | \
            grep -v "{}" | awk "{print \$2}" | sed 's/refs\/tags\/v//g' | sed 's/refs\/tags\///g' | \
            sort --version-sort
        exit 0
        ;;
	version)
		sed -i '' -e "s/s.dependency \"Bugsnag\", \".*\"/s.dependency \"Bugsnag\", \"$VERSION\"/" "$SCRIPT_DIR/BugsnagReactNative.podspec"
		;;
	*)
		echo "BUG: Invalid MODE: $MODE"
		exit 1
		;;
esac

echo "Update complete!"
