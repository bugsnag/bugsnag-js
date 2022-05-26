/**
 * SSR Test 3
 * 
 * getServerSideProps calls a Promise that rejects, but does not
 * handle the rejection or await its result (returning synchronously).
 */

const Test3 = () => <h1>SSR Test 3</h1>

export async function getServerSideProps() {
  const doAsyncWork = () => Promise.reject(new Error('SSR Test 3'))

  doAsyncWork()

  return { props: {} }
}

export default Test3
