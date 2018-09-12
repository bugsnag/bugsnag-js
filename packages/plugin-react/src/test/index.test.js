/* global jest, expect, it, beforeEach, test */

import React from 'react'
import renderer from 'react-test-renderer'
import plugin from '../'

class BugsnagReport {
  updateMetaData () {
    return this
  }
}

const bugsnag = {
  BugsnagReport,
  notify: jest.fn()
}

bugsnag.BugsnagReport.getStacktrace = jest.fn()

const ErrorBoundary = plugin.init(bugsnag, React)

beforeEach(() => {
  bugsnag.notify.mockReset()
})

test('formatComponentStack(str)', () => {
  const str = `
  in BadButton
  in ErrorBoundary`
  expect(plugin.formatComponentStack(str))
    .toBe(`in BadButton\nin ErrorBoundary`)
})

const BadComponent = () => {
  throw Error('BadComponent')
}

const GoodComponent = () => 'test'

it('renders correctly', () => {
  const tree = renderer
    .create(<ErrorBoundary><GoodComponent /></ErrorBoundary>)
    .toJSON()
  expect(tree).toMatchSnapshot()
})

it('renders correctly on error', () => {
  const tree = renderer
    .create(<ErrorBoundary><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(tree).toBe(null)
})

it('calls notify on error', () => {
  renderer
    .create(<ErrorBoundary><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(bugsnag.notify).toHaveBeenCalledTimes(1)
})

it('does not render FallbackComponent when no error', () => {
  const FallbackComponent = jest.fn(() => 'fallback')
  const tree = renderer
    .create(<ErrorBoundary FallbackComponent={FallbackComponent}><GoodComponent /></ErrorBoundary>)
    .toJSON()
  expect(tree).toMatchSnapshot()
  expect(FallbackComponent).toHaveBeenCalledTimes(0)
})

it('renders FallbackComponent on error', () => {
  const FallbackComponent = jest.fn(() => 'fallback')
  const tree = renderer
    .create(<ErrorBoundary FallbackComponent={FallbackComponent}><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(tree).toMatchSnapshot()
})

it('passes the props to the FallbackComponent', () => {
  const FallbackComponent = jest.fn(() => 'fallback')
  renderer
    .create(<ErrorBoundary FallbackComponent={FallbackComponent}><BadComponent /></ErrorBoundary>)
  expect(FallbackComponent).toBeCalledWith({
    error: expect.any(Error),
    info: { componentStack: expect.any(String) }
  }, {})
})

it('it passes the beforeSend function to the Bugsnag notify call', () => {
  const beforeSend = () => {}
  renderer
    .create(<ErrorBoundary beforeSend={beforeSend}><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(bugsnag.notify).toBeCalledWith(
    expect.any(BugsnagReport),
    expect.objectContaining({ beforeSend: beforeSend })
  )
})
