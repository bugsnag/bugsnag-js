import Bugsnag, { Configuration, Breadcrumb, Session } from "../../.."
Bugsnag.start({
  onError: [
    event => true
  ],
  onBreadcrumb: (b: Breadcrumb) => {
    console.log(b.message)
    return false
  },
  user: null,
  metadata: {},
  logger: undefined,
})

const config = Configuration.load()
Bugsnag.start(config)
