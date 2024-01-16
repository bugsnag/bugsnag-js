FROM node:18
ARG GATSBY_BUGSNAG_API_KEY

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/
RUN npm run build

CMD npm run serve -- --host 0.0.0.0
