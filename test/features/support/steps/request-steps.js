const { readFile } = require('fs').promises
const { deepStrictEqual: deepEqual } = require('assert')
const { Given, When, Then } = require('@cucumber/cucumber')
const expect = require('expect')
const { fixturePath } = require('../utils')

Given('I launch an app', { timeout: 30 * 1000 }, async () => {
  return global.automator.start()
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
  const data = await readFile(fixturePath(fixture))
  const expected = JSON.parse(data.toString('utf8'))
  const actual = JSON.parse(req.body)
  expect(actual).toEqual(expected)
})

Then('minidump request {int} contains a file form field named {string} matching {string}', async (index, field, fixture) => {
  const req = global.server.minidumpUploads[index]
  const data = await readFile(fixturePath(fixture))
  const expected = JSON.parse(data.toString('utf8'))
  const upload = await readFile(req.files[field].path)
  const actual = JSON.parse(upload.toString('utf8'))
  expect(actual).toEqual(expected)
})

Then('minidump request {int} contains a file form field named {string}', (index, field) => {
  const req = global.server.minidumpUploads[index]
  expect(req.files[field]).not.toBeUndefined()
})

Then('the total requests received by the server matches:', (data) => {
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
  const data = await readFile(fixturePath(fixture))
  const expected = JSON.parse(data.toString('utf8'))
  // TODO: check received "notifier" contents match latest version
  delete expected.notifier
  // TODO: stack trace validation (for when a stack is expected) - ensure all
  // frames in `expected` are present in an actual request and in-project
  // TODO: breadcrumbs validation - ensure all crumbs in `expected` are present
  // in an actual request
  const matches = global.server.eventUploads.filter(req => {
    try {
      deepEqual(expected, JSON.parse(req.body.trim()))
      return true
    } catch (e) {
      return false
    }
  })
  expect(matches.length).toBeGreaterThan(0)
})

Then('the contents of a session request matches {string}', (string) => {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})
