# @bugsnag/delivery-expo

This delivery mechanism uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to send error reports to Bugsnag's API. If the report fails to deliver due to a network error, it is cached on disk and retried later.

## License
MIT
