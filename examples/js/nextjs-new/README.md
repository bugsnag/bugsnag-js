# Next.js

This is an example project showing how to use the `@bugsnag/js` notifier to track server, browser, and Vercel serverless errors on a Next.js project.

This example covers various different scenarios where errors can occur in a next.js project. Currently not all scenarios are captured by Bugsnag.

Note: Exceptions in development mode take a different path than in production. These tests should be run on a production build deployed to Vercel.

## Configuration

- Create a `.env.local` file and add your project's API key `NEXT_PUBLIC_BUGSNAG_API_KEY=abc123`
- Create a production build with `npm run build`. This will also upload source maps
- Run with `npm start`. Use the various pages to trigger different error scenarios
- Deploy to Vercel to verify differences between the types of errors that are captured locally

## Test Cases

| Test          | Description                                                                                                                                                                    |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| /api/test1    | API has a top-of-module Promise that rejects, but its result is not awaited.                                                                                                   |
| /api/test2    | API has a top-of-module exception.                                                                                                                                             |
| /api/test3    | API has has an exception in its request handler.                                                                                                                               |
| /api/test4    | API uses a try/catch to handle an exception and records it.                                                                                                                    |
| /ssr/test1    | getServerSideProps throws an Error.                                                                                                                                            |
| /ssr/test2    | getServerSideProps returns a Promise that rejects.                                                                                                                             |
| /ssr/test3    | getServerSideProps calls a Promise that rejects, but does not handle the rejection or await its result (returning synchronously).                                              |
| /ssr/test4    | getServerSideProps manually captures an exception from a try/catch.                                                                                                            |
| /client/test1 | There is a top-of-module Promise that rejects, but its result is not awaited.                                                                                                  |
| /client/test2 | There is a top-of-module exception. _error.js should render.                                                                                                                   |
| /client/test3 | There is an exception during React lifecycle that is caught by Next.js's React Error Boundary. In this case, when the component mounts. This should cause _error.js to render. |
| /client/test4 | There is an unhandled Promise rejection during React lifecycle. In this case, when the component mounts.                                                                       |
| /client/test5 | An Error is thrown from an event handler.                                                                                                                                      |

## Known Issues

## Errors are not captured in some scenarios

With a local production build (`npm run build && npm start`):
- API Test 2 fails
- Client Test 1 fails

When deployed to Vercel:
- API Test 1, API Test 2 and API Test 4 fail
- All of the SSR tests fail

## Session started twice on page load

This is because Next.js triggers a router change (`window.history.replaceState`) following load and so two requests to sessions.bugsnag.com can be seen on page load.

## Source maps

- No source maps for server-side code. It doesn't look like next.js generates these anyway.
- Events generated on the server have source map warnings. This is to do with the project type used in Bugsnag. If a node project type is used then the source map warnings are not shown. It's also possible to avoid this by having separate projects for client and server events (by providing two different API keys).