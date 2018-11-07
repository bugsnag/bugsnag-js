# Vue

This is an example project showing how to use `@bugsnag/js` with a Vue project.

This project was bootstrapped with [`Vue CLI`](https://cli.vuejs.org/).

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git
cd bugsnag-js/examples/vue
```
Take a look at…
- [`src/lib/bugsnag.js`](src/lib/bugsnag.js) for how to setup Bugsnag once for your application so it can be imported and used anywhere
- [`src/main.js`](src/main.js) to see how the above module is loaded
- [`src/components/BadButtons.vue`](src/components/BadButtons.vue) to see how the errors are triggered

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-vue . && \
docker run -p 5000:5000 -it bugsnag-js-example-vue
```

__Note__: remember to replace `YOUR_API_KEY` in `src/lib/bugsnag.js` with your own!

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm run serve
```
__Note__: remember to replace `YOUR_API_KEY` in `src/lib/bugsnag.js` with your own!
