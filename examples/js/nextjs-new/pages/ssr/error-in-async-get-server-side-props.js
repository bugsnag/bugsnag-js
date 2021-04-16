const AsyncErrorInGetServerSideProps = () => (
  <section>
    <h1>async error in getServerSideProps</h1>
    <p>Promise rejection in getServerSideProps (fails on the server)</p>
  </section>
)

export async function getServerSideProps() {
  const doAsyncWork = () => Promise.reject(new Error('promise rejection in getServerSideProps'))

  await doAsyncWork()

  return { props: {} }
}

export default AsyncErrorInGetServerSideProps
