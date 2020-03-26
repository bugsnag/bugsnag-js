import React from 'react'
import renderer from 'react-test-renderer'
import BugsnagPluginReact from '..'

class Event {
  static create () {
    return new Event()
  }

  addMetadata () {
    return this
  }
}

const bugsnag = {
  Event,
  _notify: jest.fn()
}

const plugin = new BugsnagPluginReact(React)
const ErrorBoundary = plugin.load(bugsnag)

beforeEach(() => {
  bugsnag._notify.mockReset()
})

test('formatComponentStack(str)', () => {
  const str = `
  in BadButton
  in ErrorBoundary`
  expect(BugsnagPluginReact.formatComponentStack(str))
    .toBe('in BadButton\nin ErrorBoundary')
})

const BadComponent = () => {
  throw Error('BadComponent')
}

// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
const GoodComponent = (): JSX.Element => 'test' as unknown as JSX.Element

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
  expect(bugsnag._notify).toHaveBeenCalledTimes(1)
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
  expect(bugsnag._notify).toBeCalledWith(
    expect.any(Event),
    onError
  )
})
