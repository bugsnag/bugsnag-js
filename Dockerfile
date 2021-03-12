from node:14.15

run apt-get update && \
    apt-get upgrade --assume-yes && \
    # add packages:
    # * xvfb: fake 'X' server to run electron in headless mode
    # * electron dependencies
    apt-get install xvfb libnss3 libatk-bridge2.0-0 \
                    libgtk-3-0 libasound2 --assume-yes

copy ./ /src

workdir /src

# avoid downloading web browsers for testing during npm install
env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

run npm install

run npm run bootstrap

arg ELECTRON_VERSION
run npm install electron@$ELECTRON_VERSION

cmd npm run test:unit && npm run test:cucumber
