/* global jest, expect, it, beforeEach, test */

import React from 'react'
import renderer from 'react-test-renderer'
import plugin from '../'

class Event {
  addMetadata () {
  }
}

const bugsnagClient = {
  Event,
  _notify: jest.fn()
}

bugsnagClient.Event.getStacktrace = jest.fn()
bugsnagClient.Event.prototype.addMetadata = jest.fn()

const ErrorBoundary = plugin.init(bugsnagClient, React)

beforeEach(() => {
  bugsnagClient._notify.mockReset()
})

test('formatComponentStack(str)', () => {
  const str = `
  in BadButton
  in ErrorBoundary`
  expect(plugin.formatComponentStack(str))
    .toBe('in BadButton\nin ErrorBoundary')
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
  expect(bugsnagClient._notify).toHaveBeenCalledTimes(1)
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

it('it passes the onError function to the Bugsnag notify call', () => {
  const onError = () => {}
  renderer
    .create(<ErrorBoundary onError={onError}><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(bugsnagClient._notify).toBeCalledWith(
    expect.any(Event),
    expect.arrayContaining([expect.any(Function), onError])
  )
})
