/**
 * Client Test 3
 * 
 * There is an exception during React lifecycle that is caught by Next.js's React Error Boundary.
 * In this case, when the component mounts. This should cause _error.js to render.
 */

 import { useEffect } from 'react'

const Test3 = () => {
  useEffect(() => {
    throw new Error('Client Test 3')
  }, [])

  return <h1>Client Test 3</h1>
}

export default Test3
