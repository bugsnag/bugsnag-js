# @bugsnag/derecursify

Internal utility for safely serializing objects by removing circular references and handling various data types without calling `toJSON` methods.

This is a private package used internally by other Bugsnag packages.

## Usage

```javascript
const derecursify = require('@bugsnag/derecursify')

const obj = { a: 1, b: new Date(), c: new Error('test') }
obj.circular = obj

const safe = derecursify(obj)
// Returns: { a: 1, b: '2025-07-03T...' c: { name: 'Error', message: 'test' }, circular: '[Circular]' }
```

## Features

- Removes circular references
- Handles errors by extracting name and message
- Converts dates to ISO strings
- Preserves arrays, Sets, and Maps
- Does not call `toJSON` methods
- No fixed depth limit
