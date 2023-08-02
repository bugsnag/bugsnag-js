#!/usr/bin/env sh

if [[ "$BUILDKITE_MESSAGE" == *"[full ci]"* ||
  "$BUILDKITE_BRANCH" == "next" ||
  "$BUILDKITE_BRANCH" == "main" ||
  "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" == "main" ]]; then
  echo "Running full build"
  buildkite-agent pipeline upload .buildkite/full/pipeline.full.yml
else
  # Basic build, but allow a full build to be triggered
  echo "Running basic build"
  buildkite-agent pipeline upload .buildkite/full/block.yml
fi
