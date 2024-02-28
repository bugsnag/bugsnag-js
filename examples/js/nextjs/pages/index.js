import Link from 'next/link'

const Index = () => (
  <div style={{ maxWidth: 700, margin: '0 auto' }}>
    <h2>Bugsnag next.js Example</h2>
    <p>
      This example demonstrates how to record exceptions in your code with
      Bugsnag. There are several scenario pages below that result in various
      kinds of unhandled and handled exceptions.
    </p>
    <p>
      <strong>Important:</strong> exceptions in development mode take a
      different path than in production. These scenarios should be run on a
      production build (i.e. 'next build').{' '}
      <a href="https://nextjs.org/docs/advanced-features/custom-error-page#customizing-the-error-page">
        Read more
      </a>
    </p>
    <ol>
      <li>API route exceptions</li>
      <ol>
        <li>
          API has a top-of-module Promise that rejects, but its result is not
          awaited.{' '}
          <a href="/api/scenario1" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          API has a top-of-module exception.
          <a href="/api/scenario2" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          API has has an exception in its request handler.{' '}
          <a href="/api/scenario3" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          API uses a try/catch to handle an exception and records it.{' '}
          <a href="/api/scenario4" target="_blank">
            Open in a new tab
          </a>
        </li>
      </ol>
      <li>SSR exceptions</li>
      <ol>
        <li>
          getServerSideProps throws an Error.
          <a href="/ssr/scenario1" target="_blank">
            Open in a new tab
          </a>{' '}
          or{' '}
          <Link href="/ssr/scenario1" prefetch={false}>
            Perform client side navigation
          </Link>
        </li>
        <li>
          getServerSideProps returns a Promise that rejects.
          <a href="/ssr/scenario2" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          getServerSideProps calls a Promise that rejects, but does not handle
          the rejection or await its result (returning synchronously).
          <a href="/ssr/scenario3" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          getServerSideProps manually captures an exception from a try/catch.{' '}
          <a href="/ssr/scenario4" target="_blank">
            Open in a new tab
          </a>
        </li>
      </ol>
      <li>Client exceptions</li>
      <ol>
        <li>
          There is a top-of-module Promise that rejects, but its result is not
          awaited.{' '}
          <Link href="/client/scenario1" prefetch={false}>
            Perform client side navigation
          </Link>{' '}
          or{' '}
          <a href="/client/scenario1" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          There is a top-of-module exception. _error.js should render.{' '}
          <Link href="/client/scenario2" prefetch={false}>
            Perform client side navigation
          </Link>{' '}
          or{' '}
          <a href="/client/scenario2" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          There is an exception during React lifecycle that is caught by
          Next.js's React Error Boundary. In this case, when the component
          mounts. This should cause _error.js to render.{' '}
          <Link href="/client/scenario3" prefetch={false}>
            Perform client side navigation
          </Link>{' '}
          or{' '}
          <a href="/client/scenario3" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          There is an unhandled Promise rejection during React lifecycle. In
          this case, when the component mounts.{' '}
          <Link href="/client/scenario4" prefetch={false}>
            Perform client side navigation
          </Link>{' '}
          or{' '}
          <a href="/client/scenario4" target="_blank">
            Open in a new tab
          </a>
        </li>
        <li>
          An Error is thrown from an event handler.{' '}
          <Link href="/client/scenario5" prefetch={false}>
            Perform client side navigation
          </Link>{' '}
          or{' '}
          <a href="/client/scenario5" target="_blank">
            Open in a new tab
          </a>
        </li>
      </ol>
    </ol>
  </div>
)

export default Index
