import Bugsnag from '@bugsnag/js'

const Test5 = () => (
  <>
    <h1>Client Test 5</h1>
    <button
      onClick={() => {
        try {
          // Some operation the button does, but fails
          throw new Error('Client Test 5')
        } catch (error) {
          Bugsnag.notify(error)
        }
      }}
    >
      Click me to throw an Error
    </button>
  </>
)

export default Test5
