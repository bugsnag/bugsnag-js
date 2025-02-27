#!/usr/bin/env sh

# if [[ "$BUILDKITE_MESSAGE" == *"[full ci]"* ||
#   "$BUILDKITE_BRANCH" == "next" ||
#   "$BUILDKITE_BRANCH" == "main" ||
#   "$BUILDKITE_BRANCH" == "master" ||
#   "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "main" ||
#   "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "master" ]]; then
#   echo "Running full build"
#   buildkite-agent pipeline upload .buildkite/full/pipeline.full.yml
# else
#   # Basic build, but allow a full build to be triggered
#   echo "Running basic build"
#   buildkite-agent pipeline upload .buildkite/full/block.yml
# fi

ignored_files=("README.md" "LICENSE.txt" ".gitignore")
packages=$(cat .buildkite/package_manifest.json)
upload=()

# Detect packages that have changed and upload relates pipeline file(s)
# 1. Get list of changed files between this and target branch
for file in $(git diff --name-only $BASE HEAD); do

  # 2. Skip checking any files in the ignored_files list
  for ignored_file in ${ignored_files[@]}; do
    if [[ $file =~ $ignored_file ]]; then
      echo "Skipping $file based on ignored_files list"
      continue 2
    fi
  done

  # 3. Check if the changed file relates to a pipeline
  for pipeline in $(echo $packages | jq -r '.[] | select(.paths[] | inside("'${file}'")) | .pipeline'); do
    if [[ ! " ${upload[@]} " =~ $pipeline ]]; then
      upload+=($pipeline)
      echo "Adding $pipeline to upload list"
    else
      echo "Pipeline already marked for upload"
    fi
  done
done

# 4. Upload pipeline files
for pipeline in ${upload[@]}; do
  # echo "Upload pipeline file: $pipeline"
  buildkite-agent pipeline upload $pipeline
done

# 5. Upload manual overrides for pipeline files that are not triggered by changes
