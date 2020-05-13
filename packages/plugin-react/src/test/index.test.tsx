import React from 'react'
import renderer from 'react-test-renderer'
import BugsnagPluginReact from '..'
import Client from '@bugsnag/core/client'

const client = new Client({ apiKey: '123', plugins: [new BugsnagPluginReact(React)] }, undefined)
client._notify = jest.fn()

type FallbackComponentType = React.ComponentType<{
  error: Error
  info: React.ErrorInfo
}>

// eslint-disable-next-line
const ErrorBoundary = client.getPlugin('react')!.createErrorBoundary()

beforeEach(() => (client._notify as jest.Mock).mockClear())

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
  expect(client._notify).toHaveBeenCalledTimes(1)
})

it('does not render FallbackComponent when no error', () => {
  const FallbackComponent = jest.fn(() => 'fallback') as unknown as FallbackComponentType
  const tree = renderer
    .create(<ErrorBoundary FallbackComponent={FallbackComponent}><GoodComponent /></ErrorBoundary>)
    .toJSON()
  expect(tree).toMatchSnapshot()
  expect(FallbackComponent).toHaveBeenCalledTimes(0)
})

it('renders FallbackComponent on error', () => {
  const FallbackComponent = jest.fn(() => 'fallback') as unknown as FallbackComponentType
  const tree = renderer
    .create(<ErrorBoundary FallbackComponent={FallbackComponent}><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(tree).toMatchSnapshot()
})

it('passes the props to the FallbackComponent', () => {
  const FallbackComponent = jest.fn(() => 'fallback') as unknown as FallbackComponentType
  renderer
    .create(<ErrorBoundary FallbackComponent={FallbackComponent}><BadComponent /></ErrorBoundary>)
  expect(FallbackComponent).toBeCalledWith({
    error: expect.any(Error),
    info: { componentStack: expect.any(String) }
  }, {})
})

it('passes the onError function to the Bugsnag notify call', () => {
  const onError = () => {}
  renderer
    .create(<ErrorBoundary onError={onError}><BadComponent /></ErrorBoundary>)
    .toJSON()
  expect(client._notify).toBeCalledWith(
    expect.any(client.Event),
    onError
  )
})

it('supports passing reference to React when the error boundary is created', () => {
  const client = new Client({ apiKey: '123', plugins: [new BugsnagPluginReact()] }, undefined)
  // eslint-disable-next-line
  const ErrorBoundary = client.getPlugin('react')!.createErrorBoundary(React)
  expect(ErrorBoundary).toBeTruthy()
})
