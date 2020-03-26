# Integration tests

Each test file gets its own process. Since Bugsnag hooks into various parts of the process and has no way of being unhooked or cleaned out, each file can contain at-most one use case.

Unfortunately due to the way Jest works, all of the mocking code can't be encapsulated in this directory. Mocks for node modules and built-ins have to be placed adjacent to the node_modules directory.

Since the tests are run with the same runner as the unit tests, they will currently run if you do `npm run test:unit`, or more simple `npx jest`. We can split this out into distinct pieces if desirable for ci steps and such.
