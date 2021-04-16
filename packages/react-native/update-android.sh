#!/usr/bin/env bash

# ----------
# Setup Code
# ----------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="${0##*/}"
CONFIG_FILE="$SCRIPT_DIR/prepare-android-vendor.config"

print_help() {
    echo "Usage: $SCRIPT_NAME [options]"
    echo
    echo "Options (must select one):"
    echo "    --version <version> (example: $SCRIPT_NAME --version 5.8.0)"
    echo "    --local <path>      (example: $SCRIPT_NAME --local ../../../bugsnag-android)"
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
BUGSNAG_ANDROID_REPO_DIR=

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
                exit 0
                ;;
            --local)
                if [ $# -lt 2 ]; then error_missing_field $1; fi
                full_local_path="$(cd "$2" && pwd)"
                echo "local" >"$CONFIG_FILE"
                echo "$full_local_path" >>"$CONFIG_FILE"
                exit 0
                ;;
            --sha)
                if [ $# -lt 2 ]; then error_missing_field $1; fi
                echo "sha" >"$CONFIG_FILE"
                echo "$2" >>"$CONFIG_FILE"
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
