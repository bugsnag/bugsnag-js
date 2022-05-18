# Next.js

This is an example project showing how to use the universal `@bugsnag/js` notifier to track server, browser, and vercel serverless errors on a Next.js project.

This example covers various different scenarios where errors can occur in a next.js project. Currently not all scenarios are captured by Bugsnag.

Note: Exceptions in development mode take a different path than in production. These tests should be run on a production build deployed to vercel.

## Configuration

- Create a `.env.local` file and add your project's API key `NEXT_PUBLIC_BUGSNAG_API_KEY=abc123`
- Create a production build with `npm run build`. This will also upload source maps
- Run with `npm start`. Use the various pages to trigger different error scenarios
- Deploy to vercel to verify differences between the types of errors that are captured locally

## Known Issues

With a local production build (`npm run build && npm start`):
- API Test 2 doesn't work
- Client Test 1 doesn't work

When deployed to vercel:
- API Test 1, API Test 2 and API Test 4 do not work
- None of the SSR tests work
