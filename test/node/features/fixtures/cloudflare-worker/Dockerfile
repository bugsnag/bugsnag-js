ARG NODE_VERSION=12
FROM --platform=linux/amd64 node:$NODE_VERSION-bookworm

WORKDIR /app

COPY package* ./
RUN npm install

COPY . ./

RUN npm install --no-package-lock --no-save bugsnag-node*.tgz bugsnag-plugin-cloudflare-workers*.tgz

ENV WRANGLER_SEND_METRICS=false
ENV NODE_ENV production
CMD npm run start
