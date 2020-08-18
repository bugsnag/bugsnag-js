import Bugsnag from "@bugsnag/js"

export default function CustomErrorPage({ statusCode }) {
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

CustomErrorPage.getInitialProps = (props) => {
  const { res, err } = props;
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  const error = err || new Error('Unknown error caught by CustomErrorPage.getInitialProps');

  // Ignore 404 errors
  if (statusCode === 404) {
    return { statusCode }
  }

  Bugsnag.notify(error, (event) => {
    // event.severity = 'error';
    // event.unhandled = true;
  })

  return { statusCode }
}

