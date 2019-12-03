import bugsnag from "../../.."
bugsnag({
  apiKey: "abc",
  appVersion: "1.2.3",
  appType: "worker",
  autoDetectErrors: true,
  autoDetectUnhandledRejections: true,
  onError: [],
  endpoints: {"notify":"https://notify.bugsnag.com","sessions":"https://sessions.bugsnag.com"},
  autoTrackSessions: true,
  enabledReleaseStages: [],
  releaseStage: "production",
  maxBreadcrumbs: 20,
  enabledBreadcrumbTypes: ['manual','log','request'],
  user: null,
  metaData: {},
  logger: undefined,
  filters: ["foo",/bar/],
  collectUserIp: true,
  maxEvents: 10
})
