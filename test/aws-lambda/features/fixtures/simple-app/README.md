1. Run the build script (requires Ruby):
    ```sh
    $ ../../scripts/build-fixtures simple-app
    ```

    Or run the build script all fixtures:

    ```sh
    $ ../../scripts/build-fixtures
    ```

1. Run a function:
    ```sh
    $ BUGSNAG_API_KEY=123 sam local invoke AsyncUnhandledExceptionFunction --event events/async/unhandled-exception.json
    ```

    Check `template.yaml` for all available functions
