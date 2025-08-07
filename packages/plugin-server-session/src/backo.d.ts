declare module 'backo' {
  interface BackoffOptions {
    min?: number
    max?: number
    jitter?: number
    factor?: number
  }

  class Backoff {
    attempts: number
    
    constructor(options?: BackoffOptions)
    
    duration(): number
    reset(): void
  }

  export = Backoff
}
