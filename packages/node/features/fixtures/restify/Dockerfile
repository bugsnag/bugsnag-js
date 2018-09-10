ARG NODE_VERSION=8
FROM bugsnag_node_test:$NODE_VERSION

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/

RUN npm install --no-package-lock --no-save /tmp/bugsnag-node.tgz /tmp/bugsnag-plugin-restify.tgz
RUN node --version

ENV NODE_ENV production
CMD node scenarios/app
