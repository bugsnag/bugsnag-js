set -e

rm -fr bugsnag-expo-*.tgz
npm pack ../../../../packages/expo

PACKAGE=`ls | grep bugsnag-expo`
npm i --no-package-lock --no-save file:$PACKAGE

exp start -i
