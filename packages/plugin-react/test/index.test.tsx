import React, { useState } from 'react'
import { create, act } from 'react-test-renderer'
import BugsnagPluginReact, { formatComponentStack } from '../src/plugin'
import Client from '@bugsnag/core/client'

const client = new Client(
  { apiKey: '123', plugins: [new BugsnagPluginReact(React)] },
  undefined
)
client._notify = jest.fn()

interface FallbackComponentProps {
  error: Error
  info: React.ErrorInfo
  clearError: () => void
}
type FallbackComponentType = React.ComponentType<FallbackComponentProps>;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const ErrorBoundary = client.getPlugin('react')!.createErrorBoundary()

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => (client._notify as jest.Mock).mockClear())

test('formatComponentStack(str)', () => {
  const str = `
  in BadButton
  in ErrorBoundary`
  expect(formatComponentStack(str)).toBe('in BadButton\nin ErrorBoundary')
})

const BadComponent = () => {
  throw Error('BadComponent')
}

// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
const GoodComponent = (): JSX.Element => ('test' as unknown) as JSX.Element

const ComponentWithBadButton = () => {
  const [clicked, setClicked] = useState(false)

  if (clicked) {
    throw new Error('bad button')
  }
  return <button onClick={() => setClicked(true)}>click for error</button>
}

it('renders correctly', () => {
  const tree = create(
    <ErrorBoundary>
      <GoodComponent />
    </ErrorBoundary>
  ).toJSON()
  expect(tree).toMatchInlineSnapshot('"test"')
})

it('renders correctly on error', () => {
  const tree = create(
    <ErrorBoundary>
      <BadComponent />
    </ErrorBoundary>
  ).toJSON()
  expect(tree).toBe(null)
})

it('calls notify on error', () => {
  create(
    <ErrorBoundary>
      <BadComponent />
    </ErrorBoundary>
  ).toJSON()
  expect(client._notify).toHaveBeenCalledTimes(1)
})

it('does not render FallbackComponent when no error', () => {
  const FallbackComponent = (jest.fn(
    () => 'fallback'
  ) as unknown) as FallbackComponentType
  const tree = create(
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <GoodComponent />
    </ErrorBoundary>
  ).toJSON()
  expect(tree).toMatchInlineSnapshot('"test"')
  expect(FallbackComponent).toHaveBeenCalledTimes(0)
})

it('renders FallbackComponent on error', () => {
  const FallbackComponent = (jest.fn(
    () => 'fallback'
  ) as unknown) as FallbackComponentType
  const tree = create(
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <BadComponent />
    </ErrorBoundary>
  ).toJSON()
  expect(tree).toMatchInlineSnapshot('"fallback"')
})

it('passes the props to the FallbackComponent', () => {
  const FallbackComponent = (jest.fn(
    () => 'fallback'
  ) as unknown) as FallbackComponentType
  create(
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <BadComponent />
    </ErrorBoundary>
  )
  expect(FallbackComponent).toBeCalledWith(
    {
      error: expect.any(Error),
      info: { componentStack: expect.any(String) },
      clearError: expect.any(Function)
    },
    {}
  )
})

it('resets the error boundary when the FallbackComponent calls the passed clearError prop', () => {
  const FallbackComponent = ({ clearError }: FallbackComponentProps) => {
    return <button onClick={() => clearError()}>clearError</button>
  }

  const component = create(
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <ComponentWithBadButton />
    </ErrorBoundary>
  )
  const instance = component.root

  // Trigger a render exception
  const badButton = instance
    .findByType(ComponentWithBadButton)
    .findByType('button')
  act(() => {
    badButton.props.onClick()
  })

  // Click the button in the fallback, which calls clearError
  const button = instance.findByType(FallbackComponent).findByType('button')
  act(() => {
    button.props.onClick()
  })

  // expect to see ComponentWithBadButton again
  expect(component.toJSON()).toMatchInlineSnapshot(`
    <button
      onClick={[Function]}
    >
      click for error
    </button>
  `)
})

it('a bad FallbackComponent implementation does not trigger stack overflow', () => {
  const BadFallbackComponentImplementation = ({
    error,
    info,
    clearError
  }: FallbackComponentProps) => {
    function log (o: any) {}
    log(error)
    clearError()

    return <div>fallback</div>
  }

  expect(() => {
    create(
      <ErrorBoundary FallbackComponent={BadFallbackComponentImplementation}>
        <BadComponent />
      </ErrorBoundary>
    )
  }).toThrow()
})

it('it passes the onError function to the Bugsnag notify call', () => {
  const onError = () => {}
  create(
    <ErrorBoundary onError={onError}>
      <BadComponent />
    </ErrorBoundary>
  ).toJSON()
  expect(client._notify).toBeCalledWith(expect.any(client.Event), onError)
})

it('supports passing reference to React when the error boundary is created', () => {
  const client = new Client(
    { apiKey: '123', plugins: [new BugsnagPluginReact()] },
    undefined
  )
  // eslint-disable-next-line
  const ErrorBoundary = client.getPlugin('react')!.createErrorBoundary(React)
  expect(ErrorBoundary).toBeTruthy()
})

describe('global React', () => {
  // Workaround typescript getting upset at messing around with global
  // by taking a reference as 'any' and modifying that instead
  const globalReference: any = global
  const actualWindow = globalReference.window

  afterEach(() => {
    globalReference.window = actualWindow
    globalReference.window.React = undefined
  })

  it('can pull React out of the window object', () => {
    globalReference.window.React = React

    const client = new Client({
      apiKey: 'API_KEYYY',
      plugins: [new BugsnagPluginReact()]
    })

    // eslint-disable-next-line
    const ErrorBoundary = client.getPlugin('react')!.createErrorBoundary()

    expect(ErrorBoundary).toBeTruthy()
  })

  it('checks for window.React safely', () => {
    // Delete the window object so that any unsafe check for 'window.React' will throw
    delete globalReference.window

    const client = new Client({
      apiKey: 'API_KEYYY',
      plugins: [new BugsnagPluginReact()]
    })

    // eslint-disable-next-line
    const ErrorBoundary = client.getPlugin('react')!.createErrorBoundary(React)

    expect(ErrorBoundary).toBeTruthy()
  })
})
