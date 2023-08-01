import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  configureAsync(configuration: ReactNativeConfiguration): Promise<NativeConfiguration>

  configure(configuration: ReactNativeConfiguration): NativeConfiguration

  updateCodeBundleId(id: string | undefined | null): void

  leaveBreadcrumb(breadcrumb: NativeBreadcrumb): void

  startSession(): void

  pauseSession(): void

  resumeSession(): void

  updateContext(context: string | undefined | null): void

  addMetadata(section: string, metadata?: UnsafeObject): void

  clearMetadata(section: string, key?: string): void

  updateUser(id: string | undefined | null, email: string | undefined | null, name: string | undefined | null): void

  dispatch(payload: UnsafeObject): Promise<boolean>

  getPayloadInfo(payload: UnsafeObject): Promise<unknown>

  addFeatureFlag(name: string, variant: string | undefined | null): void

  addFeatureFlags(featureFlags: NativeFeatureFlag[]): void

  clearFeatureFlag(name: string): void

  clearFeatureFlags(): void
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ReactNativeConfiguration = {
  reactNativeVersion?: string
  engine?: string
  notifierVersion: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeConfiguration = {
  apiKey: string
  autoDetectErrors?: boolean
  autoTrackSessions?: boolean
  sendThreads?: string
  discardClasses?: string[]
  projectPackages?: string[]
  enabledReleaseStages?: string[]
  releaseStage?: string
  buildUuid?: string
  appVersion?: string
  versionCode?: number // Android only
  type?: string
  persistUser: boolean
  launchCrashThresholdMs: number
  maxBreadcrumbs: number
  enabledBreadcrumbTypes: string[]
  enabledErrorTypes: NativeEnabledErrorTypes
  endpoints: NativeEndpointConfig
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeBreadcrumb = {
  timestamp: string
  message: string
  type: string
  metadata?: UnsafeObject
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeEndpointConfig = {
  notify: string
  sessions: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeEnabledErrorTypes = {
  anrs?: boolean
  ndkCrashes?: boolean
  unhandledExceptions?: boolean
  unhandledRejections?: boolean
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeFeatureFlag = {
  name: string
  variant?: string
}

export default TurboModuleRegistry.get<Spec>('BugsnagReactNative')
