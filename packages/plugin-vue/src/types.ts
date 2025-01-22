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

export type VueErrorHandler = (err: unknown, instance: ComponentPublicInstance, info: string) => void

export interface ComponentPublicInstance {
  $parent: ComponentPublicInstance | null
  $root?: ComponentPublicInstance | null
  $options: {
    name?: string
    propsData?: unknown
  }
}
