import { Plugin, Client } from '@bugsnag/core';
import { MiddlewareHandler } from 'hono';
declare const bugsnagPluginHono: Plugin;
export default bugsnagPluginHono;
interface BugsnagPluginHonoResult {
    errorHandler: MiddlewareHandler;
    requestHandler: MiddlewareHandler;
}
declare module '@bugsnag/core' {
    interface Client {
        getPlugin(id: 'hono'): BugsnagPluginHonoResult | undefined;
    }
}
declare module 'hono' {
    export interface Request {
        bugsnag?: Client;
    }
}
