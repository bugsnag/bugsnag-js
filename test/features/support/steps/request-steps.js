const { readFile } = require('fs').promises
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

Then(/^I received (\d+) event uploads?$/, (count) => {
  expect(global.server.eventUploads.length).toEqual(count)
})

Then(/^I received (\d+) minidump uploads?$/, (count) => {
  expect(global.server.minidumpUploads.length).toEqual(count)
})

Then('the contents of event request {int} matches {string}', async (index, fixture) => {
  const req = global.server.eventUploads[index]
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

const matchValue = (expected, value) => {
  return value === expected || (expected === '{ANY}' && !!value)
}

const eventsMatchingHeaders = (data) => {
  const headers = data.raw().map(row => {
    return [row[0].toLowerCase(), row[1]]
  })
  return global.server.eventUploads.filter((e) => {
    return headers.filter(header => {
      const [key, value] = header
      return key in e.headers && matchValue(value, e.headers[key])
    }).length === headers.length
  })
}

Then('the headers of an event request contains:', (data) => {
  expect(eventsMatchingHeaders(data).length).toBeGreaterThan(0)
})

Then('the headers of every event request contains:', (data) => {
  expect(eventsMatchingHeaders(data).length).toEqual(eventsMatchingHeaders(data).length)
})

Then('the contents of an event request matches {string}', async (fixture) => {
  expect(readPayloads(global.server.eventUploads)).toContainPayload(await readFixtureFile(fixture))
})

Then('the contents of a session request matches {string}', async (fixture) => {
  expect(readPayloads(global.server.sessionUploads)).toContainPayload(await readFixtureFile(fixture))
})
