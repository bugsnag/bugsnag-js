FROM debian:stable

WORKDIR /app

COPY packages ./packages
COPY test/scripts/ ./scripts

RUN ./scripts/create_package.json_tar.sh

CMD cp min_packages.tar build/min_packages.tar