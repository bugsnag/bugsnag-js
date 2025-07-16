# @bugsnag/json-payload

A utility for normalizing file paths by making them absolute and adding trailing slashes for directories.

## Installation

```bash
npm install @bugsnag/json-payload
```

## Usage

```javascript
const normalizePath = require('@bugsnag/json-payload')

// Normalize a path
const normalizedPath = normalizePath('./some/relative/path')
// Returns: '/absolute/path/to/some/relative/path/'
```

## License

MIT
