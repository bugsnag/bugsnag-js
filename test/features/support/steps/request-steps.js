const { readFile } = require('fs').promises
const { createHash } = require('crypto')
const { Given, When, Then } = require('@cucumber/cucumber')
const { readFixtureFile } = require('../utils')
const expect = require('../utils/expect')

const REQUEST_RESOLUTION_TIMEOUT = 3000
const launchConfig = { timeout: 30 * 1000 }
const requestDelay = (callback) => new Promise((resolve, reject) => {
  setTimeout(() => callback(resolve), REQUEST_RESOLUTION_TIMEOUT)
})
const readPayloads = (requests) => {
  return requests.map(req => JSON.parse(req.body.trim()))
}

Given('I launch an app', launchConfig, async () => {
  return global.automator.start()
})

Given('I launch an app with configuration:', launchConfig, (data) => {
  const setup = { bugsnag: 'default', preload: 'default.js' }
  data.raw().forEach(row => {
    const [key, config] = row
    setup[key] = config
  })
  return global.automator.start({
    BUGSNAG_CONFIG: setup.bugsnag,
    BUGSNAG_PRELOAD: setup.preload
  })
})

When('I click {string}', async (link) => {
  return global.automator.click(link)
})

Then('the app crashed', async () => {
  expect(global.automator.crashed).toBeTruthy()
})

Then('I received {int} {word} upload(s)', (count, requestType) => {
  expect(global.server.uploadsForType(requestType).length).toEqual(count)
})

Then('the contents of {word} request {int} matches {string}', async (requestType, index, fixture) => {
  const req = global.server.uploadsForType(requestType)[index]
  expect(readPayloads([req])).toContainPayload(await readFixtureFile(fixture))
})

Then('minidump request {int} contains a file form field named {string} matching {string}', async (index, field, fixture) => {
  const req = global.server.minidumpUploads[index]
  const expected = await readFixtureFile(fixture)
  const upload = await readFile(req.files[field].path)
  const actual = JSON.parse(upload.toString('utf8'))
  expect(actual).toEqual(expected)
})

Then('minidump request {int} contains a file form field named {string}', (index, field) => {
  const req = global.server.minidumpUploads[index]
  expect(req.files[field]).not.toBeUndefined()
})

Then('the total requests received by the server matches:', async (data) => {
  return requestDelay((done) => {
    data.raw().forEach(row => {
      const [key, count] = row
      switch (key) {
        case 'minidumps':
          expect(global.server.minidumpUploads.length).toEqual(parseInt(count))
          break
        case 'sessions':
          expect(global.server.sessionUploads.length).toEqual(parseInt(count))
          break
        case 'events':
          expect(global.server.eventUploads.length).toEqual(parseInt(count))
          break
        default:
          throw new Error(`no endpoint registered for ${key}`)
      }
    })
    done()
  })
})

const computeSha1 = (value) => {
  const hash = createHash('sha1')
  hash.update(value)
  return `sha1 ${hash.digest('hex')}`
}

const matchValue = (req, expected, value) => {
  return value === expected ||
    (expected === '{ANY}' && !!value) ||
    (expected === '{BODY_SHA1}' && value === computeSha1(req.body.trim()))
}

const requestsMatchingHeaders = (requests, data) => {
  const headers = data.raw().map(row => {
    return [row[0].toLowerCase(), row[1]]
  })

  return requests.filter((e) => {
    return headers.filter(header => {
      const [key, value] = header
      return key in e.headers && matchValue(e, value, e.headers[key])
    }).length === headers.length
  })
}

Then('the headers of a(n) {word} request contains:', (requestType, data) => {
  const requests = global.server.uploadsForType(requestType)
  expect(requestsMatchingHeaders(requests, data).length).toBeGreaterThan(0)
})

Then('the headers of every {word} request contains:', (requestType, data) => {
  const requests = global.server.uploadsForType(requestType)
  expect(requestsMatchingHeaders(requests, data).length).toEqual(requests.length)
})

Then('the contents of a(n) {word} request matches {string}', async (requestType, fixture) => {
  expect(readPayloads(global.server.uploadsForType(requestType))).toContainPayload(await readFixtureFile(fixture))
})
