import Bugsnag from "@bugsnag/js"
import NextErrorComponent from 'next/error'

export default function CustomErrorPage({ statusCode, hasGetInitialPropsRun, err }) {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.js so it can be captured
    Bugsnag.notify(err, (event) => {
      event.severity = 'error';
      event.unhandled = true;
    })
  }

  return (
    <>
      <p>Custom error handler (_error.tsx)</p>
      <p>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
    </>
  )
}

CustomErrorPage.getInitialProps = async ({ req, res, err, asPath }) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps({
    res,
    err,
  })

  // Workaround for https://github.com/vercel/next.js/issues/8592, mark when
  // getInitialProps has run
  errorInitialProps.hasGetInitialPropsRun = true

  // Running on the server, the response object (`res`) is available.
  //
  // Next.js will pass an err on the server if a page's data fetching methods
  // threw or returned a Promise that rejected
  //
  // Running on the client (browser), Next.js will provide an err if:
  //
  //  - a page's `getInitialProps` threw or returned a Promise that rejected
  //  - an exception was thrown somewhere in the React lifecycle (render,
  //    componentDidMount, etc) that was caught by Next.js's React Error
  //    Boundary. Read more about what types of exceptions are caught by Error
  //    Boundaries: https://reactjs.org/docs/error-boundaries.html

  if (err) {
    Bugsnag.notify(err, (event) => {
      event.severity = 'error';
      event.unhandled = true;
      event.request = req;
    })

    // Flushing before returning is necessary if deploying to Vercel, see
    // https://vercel.com/docs/platform/limits#streaming-responses
    await require('@bugsnag/in-flight').flush(2000);

    return errorInitialProps;
  }

  // If this point is reached, getInitialProps was called without any
  // information about what the error might be. This is unexpected and may
  // indicate a bug introduced in Next.js, so record it in Bugsnag
  Bugsnag.notify(new Error(`_error.js getInitialProps missing data at path: ${asPath}`), (event) => {
    event.severity = 'error';
    event.unhandled = true;
    event.request = req;
  })
  await require('@bugsnag/in-flight').flush(2000);

  return errorInitialProps;
}
