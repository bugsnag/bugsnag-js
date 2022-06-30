# Nuxt.js

This is an example project showing how to use the universal `@bugsnag/js` notifier to track both server and browser errors on a Nuxt.js project.

We recommend creating two projects in your dashboard, one for the server errors and one for the browser errors.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/nuxtjs
```

Take a look at…
- [`modules/bugsnag/index.js`](modules/bugsnag/index.js) for how to integrate Bugsnag using the Nuxt module system. This file is run on the server, so includes the server-side setup of Bugsnag. It also dynamically registers [`modules/bugsnag/client.js`](modules/bugsnag/client.js) as a browser plugin.
- [`modules/bugsnag/client.js`](modules/bugsnag/client.js) to see the client-side setup. Almost identical to the Vue example, this version uses the Nuxt-specific [`inject()`](https://nuxtjs.org/guide/plugins#combined-inject) function which means Bugsnag is available in as `this.$bugsnag` in Vue components, and as `context.app.$bugsnag` in cases _before_ Vue has started – e.g. in the `asyncData` method of a component.
- [`nuxt.config.js`](nuxt.config.js) to see how you can centralize your configuration, including your Bugsnag API keys
- [`pages/index.vue`](pages/index.vue) and [`pages/borked.vue`](pages/index.vue) to see how the pages are rendered and how the server error is triggered
- [`components/BadButtons.vue`](components/BadButtons.vue) to see how the client errors are triggered

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-nuxt . && \
docker run -p 3000:3000 -it bugsnag-js-example-nuxt
```

__Note__: remember to replace the API keys in [`nuxt.config.js`](nuxt.config.js) with your own!

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm run build
npm start
```
__Note__: remember to replace the API keys in [`nuxt.config.js`](nuxt.config.js) with your own!

## BugsnagSourceMapUploaderPlugin

Example configuration of the `BugsnagSourceMapUploaderPlugin` in `nuxt.config.js`:

```
build: {
	/*
	** You can extend webpack config here
	*/

	extend (config, { isDev, isClient }) {

		if (!isDev && isClient) {

			config.devtool = 'source-map'

		 	config.plugins.push(
				new BugsnagSourceMapUploaderPlugin({
					apiKey: 'notifier-api-key',
					appVersion: require('./package.json').version,
					releaseStage: 'production',
					overwrite: true
				})
			)
		}
	},
	plugins: [
	]
}
```
