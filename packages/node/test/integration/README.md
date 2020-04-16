# Integration tests

Each test file gets its own process. Since Bugsnag hooks into various parts of the process and has no way of being unhooked or cleaned out, each file can contain at-most one use case.

Since the tests are run with the same runner as the unit tests, they will currently run if you do `npm run test:unit`, or more simple `npx jest`. We can split this out into distinct pieces if desirable for ci steps and such.
