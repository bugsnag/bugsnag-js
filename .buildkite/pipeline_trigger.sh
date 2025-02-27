#!/usr/bin/env sh

BASE=$BUILDKITE_PULL_REQUEST_BASE_BRANCH
COMMIT=$BUILDKITE_COMMIT

BRANCH_POINT_COMMIT=$(git merge-base origin/$BASE $COMMIT)

if [[ "$BUILDKITE_MESSAGE" == *"[full ci]"* ||
  "$BUILDKITE_BRANCH" == "next" ||
  "$BUILDKITE_BRANCH" == "main" ||
  "$BUILDKITE_BRANCH" == "master" ||
  "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "main" ||
  "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "master" ]]; then
  echo "Running full build"
  buildkite-agent pipeline upload .buildkite/full/pipeline.full.yml
else
  echo "Detecting changes"
  echo "BUILDKITE_PULL_REQUEST_BASE_BRANCH: $BASE"
  echo "BASE_BRANCH commit id: $(git rev-parse $BASE)"
  echo "BUILDKITE_COMMIT: $BUILDKITE_COMMIT"

  echo "diff between $COMMIT and $BRANCH_POINT_COMMIT"
  git --no-pager diff --name-only $COMMIT..$BRANCH_POINT_COMMIT

  exit 1
  ignored_files=("README.md" "LICENSE.txt" ".gitignore")

  for pipeline in $(jq --compact-output '.[]' .buildkite/package_manifest.json); do
    paths=$(echo $pipeline | jq -r '.paths[]')
    blocker=$(echo $pipeline | jq -r '.block')
    build=$(echo $pipeline | jq -r '.pipeline')

    upload=0

    for file in $(git diff --name-only $BUILDKITE_PULL_REQUEST_BASE_BRANCH $BUILDKITE_COMMIT); do

      # 1. Skip checking any files in the ignored_files list
      for ignored_file in $ignored_files; do
        if [[ $file =~ $ignored_file ]]; then
          echo "Skipping $file based on ignored_files list"
          continue 2
        fi
      done

      # 2. Check if the pipeline is triggered by a change
      for path in $paths; do
        if [[ $file =~ $path ]]; then
          echo "file $file is in $path, mark pipeline for upload"
          upload=1
          continue
        fi
      done
    done

    if [[ $upload == 1 ]]; then
      echo "Upload pipeline file: $build"
      buildkite-agent pipeline upload $build
    else
      echo "Upload blocker file: $blocker"
      buildkite-agent pipeline upload $blocker
    fi

  done
fi
