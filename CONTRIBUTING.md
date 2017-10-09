# Contributing

<!-- toc -->

- [Testing](#testing)
  * [Strategy](#strategy)
    + [Unit tests](#unit-tests)
      - [Command](#command)
    + [Integration tests](#integration-tests)
      - [Command](#command-1)
    + [End-to-end tests](#end-to-end-tests)
      - [Command](#command-2)

<!-- tocstop -->

## Testing

### Strategy

#### Unit tests

__Every file should be 100% covered by unit tests__. These tests can run in Node
(not every browser). This means they are fast. They serve the purpose of validating
that the logic is sound, and that individual components are implemented correctly,
functioning as intended. They do not provide guarantees for any other environments.

##### Command

```
npm run test:unit
```

#### Integration tests

__The entire module (and any publicly-exported subcomponents) should be tested against
all of the environments we support__. Each high-level feature and distinct configuration
should be run. 100% coverage is the aim, but different environments will take different
code paths, and so coverage reporting is tricky.

##### Command

```
npm run test:integration
```

#### End-to-end tests

__The entire module should be included via all of the supported delivery mechanisms
(`<script>`, `require(…)`, `AMD` etc.) in real environments__. Not every permutation
and configuration option needs to be tested at this level. Too many tests here make
for a brittle suite that will be a maintenance overhead, so we need to strike a balance.

##### Command

```
npm run test:e2e
```
