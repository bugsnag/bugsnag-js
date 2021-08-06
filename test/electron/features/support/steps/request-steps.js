const { readFile } = require('fs').promises
const { createHash } = require('crypto')
const { Given, When, Then } = require('@cucumber/cucumber')
const { readFixtureFile } = require('../utils')
const expect = require('../utils/expect')
const { applySourcemaps } = require('../utils/source-mapper')

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
  const setup = { bugsnag: 'default', preload: 'default.js', renderer_config: '{}' }
  data.raw().forEach(row => {
    const [key, config] = row
    setup[key] = config
  })

  return global.automator.start({
    BUGSNAG_CONFIG: setup.bugsnag,
    BUGSNAG_PRELOAD: setup.preload,
    BUGSNAG_RENDERER_CONFIG: setup.renderer_config
  })
})

When('I click {string}', async (link) => {
  return global.automator.click(link)
})

When('I close the app', async () => {
  await global.automator.stop()
})

Then('the app crashed', async () => {
  expect(global.automator.crashed).toBeTruthy()
})

Then('I received {int} {word} upload(s)', (count, requestType) => {
  expect(global.server.uploadsForType(requestType).length).toEqual(count)
})

Then('I wait for {int} {word} upload(s)', async (count, requestType) => {
  try {
    while (global.server.uploadsForType(requestType).length < count) {
      await global.server.awaitUpload()
    }
  } catch (e) {
    throw new Error(`timeout waiting for ${count} ${requestType} - received ${global.server.uploadsForType(requestType).length}`)
  }
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

Then('minidump request {int} contains a form field named {string}', (index, field) => {
  const req = global.server.minidumpUploads[index]
  expect(req.fields[field]).not.toBeUndefined()
})

Then('minidump request {int} contains a form field named {string} matching {string}', async (index, field, fixture) => {
  const req = global.server.minidumpUploads[index]
  const expected = await readFixtureFile(fixture)
  const actual = JSON.parse(req.fields[field])
  expect([actual]).toContainPayload(expected)
})

Then('the total requests received by the server matches:', async (data) => {
  return requestDelay((done) => {
    const expected = {}
    const actual = {}
    data.raw().forEach(row => {
      const [requestType, count] = row
      expected[requestType] = parseInt(count)
      actual[requestType] = global.server.uploadsForType(requestType).length
    })
    expect(actual).toEqual(expected)
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

Then('the contents of every {word} request matches {string}', async (requestType, fixture) => {
  expect(readPayloads(global.server.uploadsForType(requestType))).toContainPayload(await readFixtureFile(fixture), { allowMultipleMatches: true })
})

Then('the contents of a session request matches {string}', async (fixture) => {
  expect(readPayloads(global.server.uploadsForType('session'))).toContainPayload(await readFixtureFile(fixture))
})

Then('the contents of an event request matches {string}', async fixture => {
  const basePath = global.app.electronAppPath()
  const payloads = readPayloads(global.server.uploadsForType('event'))
  for await (const payload of payloads) {
    for (const event of payload.events) {
      for (const exception of event.exceptions) {
        exception.stacktrace = await applySourcemaps(basePath, exception.stacktrace)
      }
    }
  }
  expect(payloads).toContainPayload(await readFixtureFile(fixture))
})

Then('exactly {int} breadcrumb(s) in event request {int} matches:', async (expectedMatches, requestIndex, data) => {
  const payloads = readPayloads(global.server.eventUploads)
  const breadcrumbs = payloads.flatMap(payload => payload.events.flatMap(event => event.breadcrumbs))

  const expectedBreadcrumb = Object.fromEntries(data.raw())
  const matches = breadcrumbs.filter(({ type, name }) => type === expectedBreadcrumb.type && name === expectedBreadcrumb.name)

  expect(matches).toHaveLength(expectedMatches)
})

Then('the event metadata {string} is less than {int}', async (field, max) => {
  const payloads = readPayloads(global.server.eventUploads)
  const metadata = payloads[0].events[0].metaData
  const [section, key] = field.split('.')
  expect(metadata).toBeDefined()
  expect(metadata[section]).toBeDefined()
  expect(metadata[section][key]).toBeDefined()
  expect(metadata[section][key]).toBeLessThan(max)
})
