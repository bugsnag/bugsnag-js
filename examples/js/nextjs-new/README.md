## Configuration

- Create a `.env.local` file and add your project's API key `NEXT_PUBLIC_BUGSNAG_API_KEY=abc123`
- Create a production build with `npm run build`. This will also upload source maps
- Run with `npm start`. Use the various pages to trigger different error scenarios


## Notes

- Error handling works differently in development mode than in production as `_error.js` is never actually called.
