# Testing and automation guide

`@bugsnag/electron` includes different levels of testing, from the most granular and general to high-level health and functionality checks, divided into groups:

* **unit** tests, which verifying the logic of individual components at the most basic level
* **linting**, which enforces some layout and style requirements on the code, which assists in avoiding common errors
* **integration** tests, which focus on the library's operation within a larger system, in this case being a packaged app

For basic instructions on running the existing tests, see the [contributing guide](../CONTRIBUTING.md). Continue reading for guidelines on adding additional tests or learning about the architecture of the integration test runner.

## Unit testing

Unit tests should be in `test/` directories under the affected package. `@bugsnag/electron` uses the [jest](https://jestjs.io/) testing framework and all tests should be written in  [TypeScript](https://www.typescriptlang.org/). Writing the tests in typescript helps to validate the type definitions in the repository and improves the quality of editor completion and linting suggestions.

```
{root}
└── packages
    └── {package name}
        └── test
            └── functionality.test.ts
```

## Linting

JavaScript and TypeScript files in this repository are linted using [ESLint](https://eslint.org/).

## Integration testing

Integration tests are written as [Cucumber](https://cucumber.io/) features, using the [cucumber.js](https://cucumber.io/docs/installation/javascript/) library. All features should be in the [`test/features`](features) directory. A [host application](fixtures/app) is packaged just once at the beginning of the test (using [electron-forge](https://www.electronforge.io/)) and includes the ability to change the Bugsnag configuration based on a file.

Each test replicates the process of packaging `@bugsnag/electron`, installing it into an app, launching the app, triggering an error handling scenario using one or more click events, and terminating the app. The test can then validate the final app state and any web requests sent from the app to ensure correct behavior.

```
{root}
└── test
    ├── features
    │   ├── some-behavior.feature
    │   └── support
    │       ├── {test helper files}
    │       └── steps.js
    └── fixtures
        ├── app
        │   └── {test app files}
        └── events
            └── {sample upload files}
```

### Customizing test execution

Run an individual test with `cucumber-js test/features/{a feature}.feature:{lineno}`

Disable re-packaging `@bugsnag/electron` by setting `SKIP_INSTALL`

Disable re-packaging the test app using `SKIP_PACKAGE_APP`

### Setting a custom configuration

Prior to launching the application, a test can specify a file to be loaded at the beginning of the application launch process and/or at the beginning of a new renderer session. The file should export a single function which requires no arguments and returns a Configuration object.

```js
// test/fixtures/config/main/custom-release-stage.js

module.exports = () => {
  return {
    releaseStage: 'custom'
  }
}
```
This configuration object is merged with default settings for API key and endpoints.

Then to include the configuration:

```gherkin
Given the main process is configured with "custom-release-stage"
```

And similarly for renderer processes, a step can configured a custom preload file used by the test app:

```gherkin
Given each renderer process uses the preload named "custom-plugin"
```

```js
// test/fixtures/config/renderer/custom-plugin.js
const CustomPlugin = { load: function(client) { /* … */ } }

Bugsnag.start({ plugins: [CustomPlugin] })
```

### Launching the application

Once configured, the app can be launched using:

```gherkin
Given I launch the app
```

### Clicking an element

```gherkin
When I click "some-element"
```
Where "some-element" is the `id` of a DOM element in the app's index.html file.

```html
<a id="some-element" onclick="..." href="...">Do something</a>
```

### Validating request counts

```gherkin
Then the total requests received by the server matches:
    | events    | 2 |
    | sessions  | 1 |
    | minidumps | 0 |
```

### Validating request headers

```gherkin
Then the headers of an event request contains:
    | Bugsnag-API-Key | 100a2272bd2b0ac0ab0f52715bbdc659 |
    | Content-Type    | application/json                 |
```
Use `{ANY}` as the value to check for the presence of a header without further validation

### Validating request body contents

Requests can be received in any order, but at least one request must match the step

#### Events

To test the contents of one of the requests received on the events endpoint:

```gherkin
Then the contents of an event request matches "renderer-handled-event.json"
```
The fixture path is resolved to `test/fixtures/events/{file name}`.

Using this step performs some transformations on fixture file:

* Each fixture file represents a single event
* Each frame of the stack trace in the fixture file must be present, in order, and in project in the received request. There may be other, out of project frames in the stacktrace
* Timestamp is ignored for the purposes of matching, though can be validated separately
* Each breadcrumb in the fixture file must be present and in order, but other breadcrumbs may be present in the received request.
* Instances of `{BUGSNAG_VERSION}` in the fixture file is replaced with the current version of `@bugsnag/electron`
* Use `{ANY}` to check for the presence of a field but not the value
* Use `{REGEX:^foo$}` to validate a string field against a regular expression

#### Sessions

To test the contents of one of the requests received on the sessions endpoint:

```gherkin
Then the contents of a session request matches "some-session.json"
```
The fixture path is resolved to `test/fixtures/sessions/{file name}`.

Using this step performs some transformations on fixture file:

* `startedAt` is ignored for the purposes of matching, though can be validated separately
* Use `{ANY}` to check for the presence of a field but not the value
* USe `{REGEX:^foo$}` to validate a string field against a regular expression

#### Minidumps

TBD, but will validate that a minidump request includes the compressed minidump file, request headers indicating the correct type, and event payload contents.

