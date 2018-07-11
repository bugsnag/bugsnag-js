# @bugsnag/delivery-x-domain-request

This delivery mechanism uses old IE browsers' built-in `XDomainRequest` to send error reports to Bugsnag's API (because they do not allow cross-domain requests with the `XMLHttpRequest` object). It is included in the browser notifier and is used by IE8, 9 and 10.

## License
MIT
