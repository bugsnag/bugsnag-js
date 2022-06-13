/**
 * Client scenario 5
 * 
 * An Error is thrown from an event handler.
 */

const Scenario5 = () => (
  <>
    <h1>Client scenario 5</h1>
    <button
      onClick={() => {
        throw new Error('Client scenario 5')
      }}
    >
      Click me to throw an Error
    </button>
  </>
)

export default Scenario5
