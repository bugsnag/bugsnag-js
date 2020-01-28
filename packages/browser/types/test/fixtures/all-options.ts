import Bugsnag, { Breadcrumb, Session } from "../../.."
Bugsnag.start({
  apiKey: "abc",
  appVersion: "1.2.3",
  appType: "worker",
  autoDetectErrors: true,
  enabledErrorTypes: {
    unhandledExceptions: true,
    unhandledRejections: true
  },
  onError: [
    event => true
  ],
  onBreadcrumb: (b: Breadcrumb) => {
    console.log(b.message)
    return false
  },
  onSession: (s: Session) => {
    console.log(s.id)
    return true
  },
  endpoints: {"notify":"https://notify.bugsnag.com","sessions":"https://sessions.bugsnag.com"},
  autoTrackSessions: true,
  enabledReleaseStages: ['zzz'],
  releaseStage: "production",
  maxBreadcrumbs: 20,
  enabledBreadcrumbTypes: ['manual','log','request'],
  user: null,
  metadata: {},
  logger: undefined,
  redactedKeys: ["foo",/bar/],
  collectUserIp: true,
  maxEvents: 10
})
