"use strict";
exports.__esModule = true;
var bugsnagInstance = undefined;
function notify(error, opts) {
    if (bugsnagInstance === undefined) {
        return false;
    }
    return bugsnagInstance.notify(error, opts);
}
exports.notify = notify;
