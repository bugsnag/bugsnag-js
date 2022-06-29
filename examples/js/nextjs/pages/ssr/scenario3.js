/**
 * SSR scenario 3
 * 
 * getServerSideProps calls a Promise that rejects, but does not
 * handle the rejection or await its result (returning synchronously).
 */

const Scenario3 = () => <h1>SSR scenario 3</h1>

export async function getServerSideProps() {
  const doAsyncWork = () => Promise.reject(new Error('SSR scenario 3'))

  doAsyncWork()

  return { props: {} }
}

export default Scenario3
