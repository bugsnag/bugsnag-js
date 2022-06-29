/**
 * Client scenario 3
 * 
 * There is an exception during React lifecycle that is caught by Next.js's React Error Boundary.
 * In this case, when the component mounts. This should cause _error.js to render.
 */

 import { useEffect } from 'react'

const Scenario3 = () => {
  useEffect(() => {
    throw new Error('Client scenario 3')
  }, [])

  return <h1>Client scenario 3</h1>
}

export default Scenario3
