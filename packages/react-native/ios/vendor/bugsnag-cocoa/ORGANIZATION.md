# Organization

Source code is grouped into the following:

## Breadcrumbs

This contains classes related to breadcrumbs. Breadcrumbs are automatically/manually captured 

## Client

This contains classes related to `Client`. This is the main interface through which users will interact with Bugsnag, by leaving breadcrumbs, manually notifying of errors, etc.

## Delivery

Contains classes related to the delivery of payloads to the Bugsnag API.

## Metadata

Contains classes related to `Metadata`, which holds arbitrary metadata added by the user. The `Client` holds the global state of metadata, which is then copied onto each `Event` so that it can be mutated/redacted before reports are delivered to the Bugsnag API.

## Payload

Contains classes which model the payload sent to the Bugsnag API. These are generally structured data which the user can manipulate in callbacks.

## Plugins

Contains code for managing plugins, which can be instantiated and add/modify behaviour tothe notifier.

## Storage

Code for handling storage of error/session payloads when a network connection is not available or a request cannot be delivered. In this case a report is cached on disk so that it can be delivered in future.
