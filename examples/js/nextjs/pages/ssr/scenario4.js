/**
 * SSR scenario 4
 * 
 * getServerSideProps manually captures an exception from a try/catch.
 */

import Bugsnag from '@bugsnag/js'

const Scenario4 = () => <h1>SSR scenario 4</h1>

export async function getServerSideProps() {
  try {
    throw new Error('SSR scenario 4')
  } catch (error) {
    Bugsnag.notify(error, (event) => {
      event.severity = 'error';
      event.unhandled = true;
    })

    // Flushing before returning is necessary if deploying to Vercel, see
    // https://vercel.com/docs/platform/limits#streaming-responses
    await require('@bugsnag/in-flight').flush(2000);
  }

  return { props: {} }
}

export default Scenario4
