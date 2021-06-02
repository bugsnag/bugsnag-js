### Node testing

To run the Node test suite:

```sh
npm run test:node
```

You can use the `NODE_VERSION` env var to choose which version of Node to run the tests on. The default version is `10`.

To run a single feature file:

```sh
npm run test:node -- features/unhandled_errors.feature
```
