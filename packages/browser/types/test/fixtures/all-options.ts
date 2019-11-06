import Bugsnag from "../../.."
Bugsnag.init({
  apiKey: "abc",
  appVersion: "1.2.3",
  appType: "worker",
  autoDetectErrors: true,
  onError: [ () => false, (event) => { event.errors[0].errorClass = 'diffclass' } ],
  endpoints: { notify: "https://notify.bugsnag.com", sessions: "https://sessions.bugsnag.com" },
  autoTrackSessions: true,
  enabledReleaseStages: [],
  releaseStage: "production",
  maxBreadcrumbs: 20,
  enabledBreadcrumbTypes: ['manual', 'log'],
  user: null,
  metadata: null,
  logger: undefined,
  redactedKeys: ["foo",/bar/],
  collectUserIp: true,
  maxEvents: 10
})
