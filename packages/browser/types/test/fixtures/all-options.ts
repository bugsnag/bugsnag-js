import bugsnag from "../../.."
bugsnag({
  apiKey: "abc",
  appVersion: "1.2.3",
  appType: "worker",
  autoNotify: true,
  beforeSend: [],
  endpoints: {"notify":"https://notify.bugsnag.com","sessions":"https://sessions.bugsnag.com"},
  autoCaptureSessions: true,
  notifyReleaseStages: [],
  releaseStage: "production",
  maxBreadcrumbs: 20,
  autoBreadcrumbs: true,
  user: null,
  metaData: null,
  logger: undefined,
  filters: ["foo",/bar/],
  collectUserIp: true,
  consoleBreadcrumbsEnabled: undefined,
  interactionBreadcrumbsEnabled: undefined,
  navigationBreadcrumbsEnabled: undefined,
  networkBreadcrumbsEnabled: undefined,
  maxEvents: 10
})
