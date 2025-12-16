import Bugsnag from '@bugsnag/node'
import BugsnagPluginCloudflareWorkers from '@bugsnag/plugin-cloudflare-workers'

Bugsnag.start({
		apiKey: process.env.BUGSNAG_API_KEY,
		endpoints: {
			notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
			sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
		},
		plugins: [BugsnagPluginCloudflareWorkers],
})

const plugin = Bugsnag.getPlugin('cloudflareWorkers')

const bugsnagHandler = plugin!.createHandler()

export default {
	fetch: bugsnagHandler(async (request, env, ctx): Promise<Response> => {
		if (request.url.endsWith('/handled')) {
			Bugsnag.notify(new Error('handled'));
		} else if (request.url.endsWith('/unhandled')) {
			throw new Error('unhandled');
		} else if (request.url.endsWith('/mtadata_a')) {
			Bugsnag.addMetadata('Metadata A', 'a', 'value a');
			Bugsnag.notify(new Error('Metadata A Error'));
		} else if (request.url.endsWith('/metadata_b')) {
			Bugsnag.addMetadata('Metadata B', 'b', 'value b');
			Bugsnag.notify(new Error('Metadata B Error'));
		} else if (request.url.endsWith('/breadcrumbs_a')) {
			Bugsnag.leaveBreadcrumb('Breadcrumb A', { message: 'Breadcrumb A' })
			Bugsnag.notify(new Error('Breadcrumb A Error'));
		} else if (request.url.endsWith('/breadcrumbs_b')) {
			Bugsnag.leaveBreadcrumb('Breadcrumb B', { message: 'Breadcrumb B' })
			Bugsnag.notify(new Error('Breadcrumb B Error'));
		}

		return new Response('Hello World!');
	}),
} satisfies ExportedHandler<Env>;
