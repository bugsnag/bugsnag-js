import Client from "./client";
import Event from "./event";
import {
  BreadcrumbType,
  BreadcrumbMetadataValue,
  Config,
  NotifiableError,
  OnErrorCallback,
  OnSessionCallback,
  OnBreadcrumbCallback,
  User,
  Plugin
} from "./common";

export default interface BugsnagStatic extends Client {
  start(apiKeyOrOpts: string | Config): Client;
  createClient(apiKeyOrOpts: string | Config): Client;
}
