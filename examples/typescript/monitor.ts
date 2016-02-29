/// <reference path="../../src/bugsnag.d.ts" />

function parentOfCrashyFunction (arg1: string, arg2: number) {
    crashyFunction();
}

function crashyFunction () {
    // Anonymous function
    (function () {
        try {
            throw new Error("Something broke");
        } catch (exception) {
            Bugsnag.notifyException(exception);
        }
    })();
}

// Top-level function call
parentOfCrashyFunction("random", 123);
