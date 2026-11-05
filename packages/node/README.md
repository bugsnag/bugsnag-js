# @bugsnag/node

This package contains the Node.js implementation of the Bugsnag notifier for JavaScript. The normal use case is to install this package via `@bugsnag/js`, but you can install it directly if you want to.

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.

## Node delivery limits

`Bugsnag.start()` and `Bugsnag.createClient()` accept an optional `deliveryOptions` object. Each property is independently optional; omitting it preserves the previous behavior for that limit.

| Property | Meaning |
| --- | --- |
| `maxInFlight` | Maximum concurrent event and session deliveries for this client, shared with its contextual clones. Excess deliveries are rejected immediately, before serialization. There is no overflow queue. Independently created clients have separate limits. |
| `timeoutMs` | Overall elapsed delivery deadline in milliseconds, including serialization time and connection/agent waiting, response headers and response body. Expiry destroys the request and response. Synchronous JavaScript cannot be interrupted; if serialization consumes the deadline, no request starts. Must be at most 2147483647. |
| `maxRequestBytes` | Maximum compact JSON request size in UTF-8 bytes. Checks the serialization budget before building a full oversized JSON string. Oversized events and sessions are rejected as complete reports, rather than removing metadata and retrying. Existing redaction still applies. Requires a version of `@bugsnag/safe-json-stringify` with `supportsMaxBytes` support; an older serializer rejects delivery with `ERR_DELIVERY_SERIALIZER`. |
| `maxResponseBytes` | Maximum response body in raw bytes, for successful and unsuccessful responses. Exceeding it destroys the request and response. |

All supplied limits must be positive safe integers. A request byte cap alone does not bound concurrent work, elapsed time or response bytes. Configure all four limits to bound those resources, and select values from the application's normal report volume, payload sizes and resource budget. Limits apply after event construction and `onError` processing. They do not bound input objects, arbitrary getter/`toJSON` work, JavaScript engine allocations during property enumeration or string flattening, or work performed by custom agents. Success and pre-request rejection release capacity immediately. Failed requests release their slot when the underlying request closes. A supplied shared Agent can retain a cancelled request in its own queue until another socket becomes available; the slot stays reserved during that time to prevent accumulating cancelled requests. Its delivery callback still completes at the deadline. Existing uncaught-exception handlers still receive completion and can terminate the process.

The optional `onDelivery(result)` callback reports one fixed outcome for each completed event/session delivery. Results contain only `kind` (`event` or `session`), `status` (`success`, `failed` or `rejected`), and `reason` (`success`, `capacity`, `timeout`, `request_size`, `response_size`, `closed`, `http`, `transport`, `serialization` or `configuration`). Success means an HTTP 2xx response was fully read; it does not prove downstream processing. Deliveries disabled or filtered before reaching the transport do not produce an outcome.

Use this callback to update fixed counters or another bounded diagnostics path. It replaces per-delivery logger messages. Exceptions from it are ignored. It must return promptly and must not report errors through this client: reentrant sends are rejected with `ERR_DELIVERY_OBSERVER` without invoking the observer again. Do not retain payloads, add an event backlog or emit a full log for every rejection. Capacity and request-size rejections do not produce per-delivery logs even without an observer. Asynchronous work started by an observer remains the application's responsibility.
