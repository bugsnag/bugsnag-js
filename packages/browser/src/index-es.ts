export { default } from './bugsnag'
export type { BrowserBugsnagStatic, BrowserConfig } from './bugsnag'

// Export only the essential parts from core to reduce bundle size
export { 
  Breadcrumb, 
  Client, 
  Event, 
  Session,
  schema,
  // Common types and interfaces
  type Config,
  type BugsnagStatic,
  type Plugin,
  type OnErrorCallback,
  type OnBreadcrumbCallback,
  type OnSessionCallback,
  type User,
  type FeatureFlag,
  type BreadcrumbType,
  BREADCRUMB_TYPES
} from '@bugsnag/core'
