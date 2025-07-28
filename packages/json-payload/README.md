# @bugsnag/json-payload

A utility for safely serializing BugSnag event and session payloads to JSON with built-in data redaction and size management.

## Installation

```bash
npm install @bugsnag/json-payload
```

## Usage

This package provides two main functions for serializing BugSnag payloads:

### Event Payloads

```javascript
import { event } from '@bugsnag/json-payload'

// Serialize an event payload with optional data redaction
const jsonString = event(eventPayload, ['apiKey', 'password'])
```

The `event` function:
- Safely stringifies event delivery payloads
- Automatically redacts sensitive data from predefined paths:
  - `events.[].metaData`
  - `events.[].breadcrumbs.[].metaData` 
  - `events.[].request`
- Accepts an optional array of keys/patterns to redact
- Enforces a 1MB size limit - if exceeded, it strips metadata from the first event and adds a warning message
- Only attempts to reduce payload size by removing metadata from the first event

### Session Payloads

```javascript
import { session } from '@bugsnag/json-payload'

// Serialize a session payload
const jsonString = session(sessionPayload)
```

The `session` function safely stringifies session delivery payloads.

## Features

- **Safe JSON Stringification**: Uses `@bugsnag/safe-json-stringify` to handle circular references and other edge cases
- **Automatic Data Redaction**: Redacts sensitive information from known paths
- **Size Management**: Automatically handles payloads that exceed size limits
- **TypeScript Support**: Full TypeScript definitions included

## License

MIT
