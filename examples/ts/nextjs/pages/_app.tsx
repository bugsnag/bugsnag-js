import * as React from 'react'
import '../lib/bugsnag'
import Bugsnag from '@bugsnag/js'

const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React);

export default function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary FallbackComponent={() => <div>Bugsnag error boundary fallback component</div>}>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
