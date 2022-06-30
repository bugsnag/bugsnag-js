# Angular

This is an example project showing how to use `@bugsnag/js` with a Angular project.

This project was bootstrapped with [`Angular CLI`](https://github.com/angular/angular-cli).

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/ts/angular
```

Take a look at…

- [`src/app/app.module.ts`](src/app/app.module.ts) for how to setup Bugsnag for your application to see how the `BugsnagErrorHandler` is applied to the Angular app
- [`src/app/app.component.ts`](src/app/app.component.ts) to see how the errors are triggered

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-angular . && \
docker run -p 4200:4200 -it bugsnag-js-example-angular
```

__Note__: remember to replace `YOUR_API_KEY` in `src/app/app.module.ts` with your own!

### Without docker
Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm run serve
```

__Note__: remember to replace `YOUR_API_KEY` in `src/app/app.module.ts` with your own!
