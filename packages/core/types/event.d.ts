import Breadcrumb from './breadcrumb'
import {
  App,
  Device,
  Request,
  Logger,
  User,
  Thread,
  Stackframe
} from './common'

declare class Event {
  public static create(
    maybeError: any,
    tolerateNonErrors: boolean,
    handledState: HandledState,
    component: string,
    errorFramesToSkip: number,
    logger?: Logger
  ): Event

  public app: App
  public device: Device
  public request: Request

  public errors: Error[];
  public breadcrumbs: Breadcrumb[]
  public threads: Thread[]

  public severity: 'info' | 'warning' | 'error'

  public readonly originalError: any
  public unhandled: boolean

  public apiKey?: string
  public context?: string
  public groupingHash?: string

  // user
  public getUser(): User
  public setUser(id?: string, email?: string, name?: string): void

  // metadata
  public addMetadata(section: string, values: { [key: string]: any }): void
  public addMetadata(section: string, key: string, value: any): void
  public getMetadata(section: string, key?: string): any
  public clearMetadata(section: string, key?: string): void
}

interface HandledState {
  severity: string
  unhandled: boolean
  severityReason: {
    type: string
    [key: string]: any
  }
}

export interface Error {
  errorClass: string
  errorMessage: string
  stacktrace: Stackframe[]
  type: string
}

export default Event
