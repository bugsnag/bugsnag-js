/**
 * SSR scenario 2
 * 
 * getServerSideProps returns a Promise that rejects.
 */

const Scenario2 = () => <h1>SSR scenario 2</h1>

export async function getServerSideProps() {
  return Promise.reject(Error('SSR scenario 2'))
}

export default Scenario2
