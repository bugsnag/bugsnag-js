export { default } from './bugsnag'
export type { BrowserBugsnagStatic, BrowserConfig } from './bugsnag'

// Export only the essential parts from core to reduce bundle size
export { 
  Breadcrumb, 
  Client, 
  Event, 
  Session,
  schema,
  BREADCRUMB_TYPES
} from '@bugsnag/core'

export type {
    Config,
    BugsnagStatic,
    Plugin,
    OnErrorCallback,
    OnBreadcrumbCallback,
    OnSessionCallback,
    User,
    FeatureFlag,
    BreadcrumbType,
} from '@bugsnag/core'
