FROM node:8@sha256:a681bf74805b80d03eb21a6c0ef168a976108a287a74167ab593fc953aac34df

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/
CMD npm run serve -- --host 0.0.0.0
