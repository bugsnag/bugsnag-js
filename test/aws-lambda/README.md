## Setup

1. [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

1. Install Maze Runner:

    ```sh
    $ bundle install
    ```

## Running the tests

Run Maze Runner with the `--bind-address` option:

```sh
$ bundle exec maze-runner --bind-address=0.0.0.0
```

This will build all of the fixtures before running the tests
