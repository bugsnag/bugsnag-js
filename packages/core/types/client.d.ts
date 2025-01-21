import Breadcrumb from './breadcrumb'
import {
  NotifiableError,
  BreadcrumbType,
  OnErrorCallback,
  OnSessionCallback,
  OnBreadcrumbCallback,
  User,
  FeatureFlag
} from './common'
import Event from './event'
import Session from './session'

declare class Client {
  protected constructor();

  // reporting errors
  public notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    postReportCallback?: (err: any, event: Event) => void
  ): void;

  public _notify(
    event: Event,
    onError?: OnErrorCallback,
    postReportCallback?: (err: any, event: Event) => void,
  ): void;

  // breadcrumbs
  public leaveBreadcrumb(
    message: string,
    metadata?: { [key: string]: any },
    type?: BreadcrumbType
  ): void;

  // metadata
  public addMetadata(section: string, values: { [key: string]: any }): void;
  public addMetadata(section: string, key: string, value: any): void;
  public getMetadata(section: string, key?: string): any;
  public clearMetadata(section: string, key?: string): void;

  // feature flags
  public addFeatureFlag(name: string, variant?: string | null): void
  public addFeatureFlags(featureFlags: FeatureFlag[]): void
  public clearFeatureFlag(name: string): void
  public clearFeatureFlags(): void

  // context
  public getContext(): string | undefined;
  public setContext(c: string): void;

  // user
  public getUser(): User;
  public setUser(id?: string | null, email?: string | null, name?: string | null): void;

  // sessions
  public startSession(): Client;
  public pauseSession(): void;
  public resumeSession(): Client;

  // callbacks
  public addOnError(fn: OnErrorCallback): void;
  public removeOnError(fn: OnErrorCallback): void;

  public addOnSession(fn: OnSessionCallback): void;
  public removeOnSession(fn: OnSessionCallback): void;

  public addOnBreadcrumb(fn: OnBreadcrumbCallback): void;
  public removeOnBreadcrumb(fn: OnBreadcrumbCallback): void;

  // plugins
  public getPlugin(name: string): any;

  // implemented on the browser notifier only
  public resetEventCount?(): void;

  // access to internal classes
  public Breadcrumb: typeof Breadcrumb;
  public Event: typeof Event;
  public Session: typeof Session;
}

export default Client
