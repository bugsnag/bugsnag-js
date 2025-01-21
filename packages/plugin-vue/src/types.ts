export interface VueConfig {
  errorHandler?: VueErrorHandler
}

export interface VueConstructor {
  config: VueConfig
}

export interface VueApp {
  use: (plugin: { install: (app: VueApp, ...options: any[]) => any }) => void
  config: VueConfig
}

export type VueErrorHandler = (err: any, instance: any, info: any) => void
