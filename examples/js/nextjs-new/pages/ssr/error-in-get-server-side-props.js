const ErrorInGetServerSideProps = () => (
  <section>
    <h1>Error in getServerSideProps</h1>
    <p>Error thrown in getServerSideProps (fails on the server)</p>
  </section>
)

export function getServerSideProps() {
  throw new Error('ErrorInGetServerSideProps')
}

export default ErrorInGetServerSideProps
