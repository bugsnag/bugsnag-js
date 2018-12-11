# CI test image for unit/lint/type tests
FROM node:10-alpine as ci

RUN apk add --update bash

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npx lerna bootstrap
RUN npm run build

# Image used to build the features required to run the maze-runner tests on node
FROM ci as node-feature-builder
WORKDIR /app
RUN npm pack --verbose packages/node/
RUN npm pack --verbose packages/plugin-express/
RUN npm pack --verbose packages/plugin-koa/
RUN npm pack --verbose packages/plugin-restify/

# The maze-runner browser tests
FROM 855461928731.dkr.ecr.us-west-1.amazonaws.com/maze-runner:node-cli as node-maze-runner
WORKDIR /app/
COPY packages/node/ .
COPY --from=node-feature-builder /app/*.tgz ./
RUN for d in features/fixtures/*/; do cp /app/*.tgz "$d"; done