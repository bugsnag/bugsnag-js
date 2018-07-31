#!/usr/bin/env bash

set -e

docker build -t bugsnag_node_test:4 -f base-images/node-4/Dockerfile .
docker build -t bugsnag_node_test:6 -f base-images/node-6/Dockerfile .
docker build -t bugsnag_node_test:8 -f base-images/node-8/Dockerfile .
