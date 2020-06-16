export default () => {
  throw new Error('error during render of /bad-ssr');

  return (
  <div>
    <p>
      Due to the presence of getServerSideProps this page will be rendered server-side, but fail, triggering an error, handled by _error.tsx.
    </p>
    <p>
      Note this code can also get executed on the browser if the page is navigated to via browser history. In this case it will be handled by the ErrorBoundary in _app.tsx.
    </p>
  </div>
  )
}

export async function getServerSideProps(context) {
  return {
    props: {},
  }
}
