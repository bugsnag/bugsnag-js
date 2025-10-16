# @bugsnag/path-normalizer

A utility for normalizing file paths by making them absolute and adding trailing slashes for directories.

## Installation

```bash
npm install @bugsnag/path-normalizer
```

## Usage

```javascript
const normalizePath = require('@bugsnag/path-normalizer')

// Normalize a path
const normalizedPath = normalizePath('./some/relative/path')
// Returns: '/absolute/path/to/some/relative/path/'
```

## License

MIT
