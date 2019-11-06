import Bugsnag from "../../.."
Bugsnag.init({
  apiKey: "abc",
  appVersion: "1.2.3",
  appType: "worker",
  autoDetectErrors: true,
  onError: [],
  endpoints: {"notify":"https://notify.bugsnag.com","sessions":"https://sessions.bugsnag.com"},
  autoTrackSessions: true,
  enabledReleaseStages: [],
  releaseStage: "production",
  maxBreadcrumbs: 20,
  enabledBreadcrumbTypes: [],
  user: null,
  metadata: null,
  logger: undefined,
  redactedKeys: ["foo",/bar/]
})
