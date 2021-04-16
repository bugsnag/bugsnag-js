const ErrorOnClick = () => (
  <section>
    <h1>Error on click</h1>
    <p>Error thrown in a click handler.</p>
    <button
      onClick={() => {
        throw new Error('error in click handler')
      }}
    >
      Click me to throw an Error
    </button>
  </section>
);

export default ErrorOnClick
