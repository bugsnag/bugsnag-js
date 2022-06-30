# Vue

This is an example project showing how to use `@bugsnag/js` with a Vue project.

This project was bootstrapped with [`Vue CLI`](https://cli.vuejs.org/).

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/vue
```
Take a look at…
- [`src/main.js`](src/main.js) for how to setup Bugsnag for your application
- [`src/components/BadButtons.vue`](src/components/BadButtons.vue) to see how the errors are triggered

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-vue . && \
docker run -p 5000:5000 -it bugsnag-js-example-vue
```

__Note__: remember to replace `YOUR_API_KEY` in `src/main.js` with your own!

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm run serve
```
__Note__: remember to replace `YOUR_API_KEY` in `src/main.js` with your own!
