"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = __importDefault(require("../.."));
require("jasmine");
// the client's constructor isn't public in TS so this drops down to JS to create one for the tests
function createClient(opts) {
    var c = new __1.default.Client(opts, undefined, { name: 'Type Tests', version: 'nope', url: 'https://github.com/bugsnag/bugsnag-js' });
    c._setDelivery(function () { return ({
        sendSession: function (p, cb) { cb(); },
        sendEvent: function (p, cb) { cb(); }
    }); });
    c._sessionDelegate = { startSession: function () { return c; }, pauseSession: function () { }, resumeSession: function () { } };
    return c;
}
describe('Type definitions', function () {
    it('has all the classes matching the types available at runtime', function () {
        expect(__1.default.Client).toBeDefined();
        expect(__1.default.Breadcrumb).toBeDefined();
        expect(__1.default.Event).toBeDefined();
        expect(__1.default.Session).toBeDefined();
        var client = createClient({ apiKey: 'API_KEY' });
        expect(client.Breadcrumb).toBeDefined();
        expect(client.Event).toBeDefined();
        expect(client.Session).toBeDefined();
    });
    it('works for reporting errors', function (done) {
        var client = createClient({ apiKey: 'API_KEY' });
        client.notify(new Error('uh oh'), function (event) {
            expect(event.apiKey).toBe(undefined);
            expect(event.context).toBe(undefined);
            expect(event.errors[0].errorMessage).toBe('uh oh');
            expect(event.errors[0].stacktrace.length > 0).toBe(true);
            event.addMetadata('abc', { def: 'ghi' });
            event.addMetadata('jkl', 'mno', 'pqr');
            event.clearMetadata('jkl');
            var val = event.getMetadata('jkl');
            expect(val).toBe(undefined);
        }, function (err, event) {
            expect(err).toBe(undefined);
            expect(event).toBeTruthy();
            done();
        });
    });
    it('works for reporting sessions', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        var sessionClient = client.startSession();
        sessionClient.notify(new Error('oh'));
        client.pauseSession();
        client.resumeSession();
    });
    it('works for leaving breadcrumbs', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.leaveBreadcrumb('testing 123');
        expect(client._breadcrumbs.length).toBe(1);
        expect(client._breadcrumbs[0].message).toBe('testing 123');
    });
    it('works adding and removing onError callbacks', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.addOnError(function () { });
        client.removeOnError(function () { });
    });
    it('works adding and removing onSession callbacks', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.addOnSession(function () { });
        client.removeOnSession(function () { });
    });
    it('works adding and removing onBreadcrumb callbacks', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.addOnBreadcrumb(function () { });
        client.removeOnBreadcrumb(function () { });
    });
    it('works manipulating metadata on client', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.addMetadata('abc', { def: 'ghi' });
        client.addMetadata('jkl', 'mno', 'pqr');
        client.clearMetadata('jkl');
        var val = client.getMetadata('jkl');
        expect(val).toBe(undefined);
        expect(client.getMetadata('abc', 'def')).toBe('ghi');
    });
    it('works setting context', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.setContext('foo');
        expect(client.getContext()).toBe('foo');
    });
    it('works setting/clearing user', function () {
        var client = createClient({ apiKey: 'API_KEY' });
        client.setUser('123', 'ben.gourley@bugsnag.com', 'Ben');
        expect(client.getUser()).toEqual({ id: '123', name: 'Ben', email: 'ben.gourley@bugsnag.com' });
        client.setUser(undefined, undefined, undefined);
        expect(client.getUser()).toEqual({ id: undefined, name: undefined, email: undefined });
    });
});
