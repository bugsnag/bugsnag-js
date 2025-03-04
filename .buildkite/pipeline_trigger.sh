#!/usr/bin/env sh

echo "Detecting changes to determine which pipelines to upload..."

echo "Fetching latest changes from $BUILDKITE_PULL_REQUEST_BASE_BRANCH"
git fetch origin $BUILDKITE_PULL_REQUEST_BASE_BRANCH

git --no-pager diff --name-only origin/$BUILDKITE_PULL_REQUEST_BASE_BRANCH

ignored_files=("README.md" "LICENSE.txt" ".gitignore")

for pipeline in $(jq --compact-output '.[]' .buildkite/package_manifest.json); do
  paths=$(echo $pipeline | jq -r '.paths[]')
  blocker=$(echo $pipeline | jq -r '.block')
  build=$(echo $pipeline | jq -r '.pipeline')

  upload=0

  if [[ "$BUILDKITE_MESSAGE" == *"[full ci]"* ||
    "$BUILDKITE_BRANCH" == "next" ||
    "$BUILDKITE_BRANCH" == "main" ||
    "$BUILDKITE_BRANCH" == "master" ||
    "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "main" ||
    "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "master" ]]; then
    echo "Upload pipeline file: $build"
    buildkite-agent pipeline upload $build
    continue
  fi

  for file in $(git diff --name-only origin/$BUILDKITE_PULL_REQUEST_BASE_BRANCH); do

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
