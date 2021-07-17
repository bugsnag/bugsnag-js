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

CustomErrorPage.getInitialProps = async (props) => {
  const { req, res, err, asPath } = props;
  const errorInitialProps = await NextErrorComponent.getInitialProps({
    res,
    err,
  })

  // Workaround for https://github.com/vercel/next.js/issues/8592, mark when
  // getInitialProps has run
  errorInitialProps.hasGetInitialPropsRun = true

  const error = err || new Error(`Unknown error caught by CustomErrorPage.getInitialProps ${asPath}`);

  if (errorInitialProps.statusCode !== 404) {
    Bugsnag.notify(error, (event) => {
      event.severity = 'error';
      event.unhandled = true;
      event.request = req;
    })
  }

  return errorInitialProps
}

