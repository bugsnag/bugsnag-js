/**
 * Client scenario 4
 * 
 * There is an unhandled Promise rejection during React lifecycle.
 * In this case, when the component mounts.
 */

import { useEffect } from 'react'

const Scenario4 = () => {
  useEffect(function () {
    async function doTest() {
      const doAsyncWork = () => Promise.reject(new Error('Client scenario 4'))
      await doAsyncWork()
    }
    doTest()
  }, [])

  return <h1>Client scenario 4</h1>
}

export default Scenario4
