export { default } from './notifier'
export type { BrowserLiteBugsnagStatic, BrowserLiteConfig } from './notifier'

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
    NotifiableError
} from '@bugsnag/core'
