import { Client, Breadcrumb, Event, Session, AbstractTypes } from "@bugsnag/core";

declare const Bugsnag: AbstractTypes.BugsnagStatic;
declare const Configuration: AbstractTypes.Configuration;

export default Bugsnag;
export { Client, Breadcrumb, Event, Session, AbstractTypes, Configuration };
