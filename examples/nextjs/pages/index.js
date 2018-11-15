import Head from 'next/head'

import CrashyButton from '../components/CrashyButton'
import bugsnagClient from '../lib/bugsnag'

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
    <div id="buttons">
      <h3>Send some errors by clicking below:</h3>
      <button onClick={() => bugsnagClient.notify(new Error('bad!'))}>Send handled</button>
      <button onClick={() => { throw new Error('bad!') }}>Send unhandled</button>
      <CrashyButton>Trigger a React render error</CrashyButton>
      <a className="button" href="borked">Send an error from the server</a>
    </div>
  </div>
