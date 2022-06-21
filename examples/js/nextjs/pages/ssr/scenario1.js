/**
 * SSR scenario 1
 * 
 * getServerSideProps throws an Error.
 */

const Scenario1 = () => <h1>SSR scenario 1</h1>

export function getServerSideProps() {
  throw new Error('SSR scenario 1')
}

export default Scenario1
