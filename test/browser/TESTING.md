### Browser testing

The browser tests drive real, remote browsers using BrowserStack. As a Bugsnag employee you can access the necessary 
credentials in our shared password manager.

#### Building the test fixtures

Use the `local-test-util` to build the test fixture, including the notifier from the current branch:

```shell script
./bin/local-test-util init
```

#### Running the end-to-end tests

The following environment variables need to be set:

- `BROWSER_STACK_USERNAME`
- `BROWSER_STACK_ACCESS_KEY`
- `HOST` - the test fixture host, typically `localhost`
- `API_HOST` - the MazeRunner mock server host, typically `localhost`

The browsers available to test on are the keys in [`browsers.yml`](https://github.com/bugsnag/maze-runner/blob/main/lib/maze/browsers_bs.yml).

To run all the tests, run the following in `test/browser`:

```shell script
bundle exec maze-runner --farm=bs --browser=chrome_latest
```

Or to run a single feature file:

```shell script
bundle exec maze-runner --farm=bs --browser=chrome_latest features/device.feature
```
