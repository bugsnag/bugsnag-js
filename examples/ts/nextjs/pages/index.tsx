import Head from 'next/head'
import Link from 'next/link'

import { CrashyButton } from '../components/CrashyButton'
import Bugsnag from '@bugsnag/js'

export default () =>
  <div>
    <Head>
      <title>Bugsnag Next.js Example</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link rel="stylesheet" type="text/css" href="/static/style.css" />
    </Head>
    <img width="200" src="/static/bugsnag.png" />
    <h1>Next.js example</h1>
    <p>
      This page is a basic example of how to include <code>@bugsnag/js</code> in a <a href="https://nextjs.org/">Next.js</a> app.
    </p>
    <p>
      This example is best run in production mode (build and start) as the behavior differs. For example, pages/_error.js is only used in production. In development you’ll get an error with the call stack to know where the error originated from.
    </p>
    <div id="buttons">
      <h3>Send some errors by clicking below:</h3>
      <button onClick={() => Bugsnag.notify(new Error('bad!'))}>Send handled</button>
      <button onClick={() => { throw new Error('bad!') }}>Send unhandled</button>
      <CrashyButton>Trigger a React render error</CrashyButton>
      <a className="button" href="borked">Send an error from the server</a>
      <Link href="/bad-ssr">Go to /bad-ssr</Link>
    </div>
  </div>
