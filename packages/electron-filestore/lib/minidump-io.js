const fs = require('fs')
const { randomBytes } = require('crypto')

const lookupKey = 'bugsnag_crash_id'
const lookupKeyLength = lookupKey.length
const lookupValueLength = 64

// Create an app lifetime identifier
const createIdentifier = () => {
  return randomBytes(lookupValueLength / 2).toString('hex')
}

// Read the app lifetime identifier from a file
const getIdentifier = (filepath) => {
  const key = Buffer.from(lookupKey)
  // Align to nearest 8 bytes:
  // offset = {length rounded up to nearest multiple of 8}
  const byteOffset = (lookupKeyLength | 0x7) + 1
  // ensure the chunk size is large enough to contain the entire key, value,
  // and separator. The value may wrap between chunks, but looping and
  // appending a subsequent chunk would then contain the entire value
  const chunkSize = lookupValueLength + lookupKeyLength + byteOffset
  const filestream = fs.createReadStream(filepath, { highWaterMark: chunkSize })

  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0)
    let keyIndex = -1

    const extractValue = () => {
      const start = keyIndex + byteOffset
      const end = start + lookupValueLength

      if (data.length < end) {
        reject(new Error('length too short to contain key'))
      } else {
        const identifier = data.subarray(start, end)

        if (validate(identifier)) {
          resolve(identifier.toString())
        } else {
          reject(new Error(`detected invalid identifier: "${identifier}"`))
        }
      }
    }

    filestream.on('data', (chunk) => {
      if (keyIndex >= 0) {
        // ensure entire value is in the buffer
        data = Buffer.concat([data, chunk])
        extractValue()
        // stop file streaming, skip the 'close' event
        filestream.destroy()
      } else {
        data = Buffer.concat([data, chunk])
        keyIndex = data.indexOf(key)
        if (keyIndex < 0 && data.length > lookupKeyLength) {
          // trim to the length which could plausibly contain the start of the
          // key pattern, in case the key is split between chunks
          data = data.subarray(data.length - lookupKeyLength)
        }
      }
    })

    filestream.on('close', () => {
      if (keyIndex >= 0) {
        // in case the key/value pair was found in the last chunk
        extractValue()
      } else {
        reject(new Error('no identifier found'))
      }
    })
  })
}

const validate = (id) => {
  const format = new RegExp(`^[a-z0-9]{${lookupValueLength}}$`)
  return format.test(id)
}

module.exports = {
  createIdentifier,
  getIdentifier,
  identifierKey: lookupKey
}
