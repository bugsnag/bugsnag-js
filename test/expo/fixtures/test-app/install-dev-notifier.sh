set -e
#
# rm -fr bugsnag-expo-*.tgz
# npm pack ../../../../packages/expo
#
# rm -fr .tmp
# mkdir -p .tmp
# cd .tmp
# tar -xvf ../$PACKAGE


node ../../../../packages/expo/support/bundle-dev

PACKAGE=`ls | grep bugsnag-expo`
npm i --no-package-lock --no-save file:$PACKAGE
